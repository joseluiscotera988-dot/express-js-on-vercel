// @ts-nocheck
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Instanciación diferida de Supabase (blindada contra fallos de arranque en Vercel)
const getSupabase = () => {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_KEY || '').trim();
  if (!url || !key || !url.startsWith('http')) return null;
  return createClient(url, key);
};

// Función auxiliar para registrar auditoría de cada operación
const logEvent = async (supabase: any, transaction_id: string, event: string, details: any = {}) => {
  try {
    await supabase.from('escrow_logs').insert([{ transaction_id, event, details }]);
  } catch (e) {
    console.error('Error al registrar log:', e);
  }
};

// =============================================================================
// RUTAS DEL SISTEMA
// =============================================================================

// 1. Estado del Servidor
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor Express Escrow v1.0 Activo' });
});

// 2. Obtener todas las transacciones
app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas en Vercel' });

    const { data, error } = await supabase.from('escrow_transactions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 3. Obtener transacción por ID
app.get('/api/escrow/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas' });

    const { id } = req.params;
    const { data, error } = await supabase.from('escrow_transactions').select('*').eq('id', id).single();

    if (error) return res.status(404).json({ error: 'Transacción no encontrada' });
    return res.status(200).json({ status: 'OK', transaction: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 4. Crear nueva orden de Escrow
app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas' });

    const { buyer_id, seller_id, amount, description } = req.body;

    if (!buyer_id || !seller_id || !amount) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios: buyer_id, seller_id, amount' });
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .insert([{ buyer_id, seller_id, amount: Number(amount), description, status: 'pending' }])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    await logEvent(supabase, data[0].id, 'TRANSACTION_CREATED', { buyer_id, seller_id, amount });

    return res.status(201).json({ status: 'Creado', transaction: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 5. Cambiar estado manualmente (Liberar / Cancelar)
app.patch('/api/escrow/status', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas' });

    const { transaction_id, status } = req.body;
    const validStatuses = ['pending', 'funded', 'completed', 'disputed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Opciones válidas: ${validStatuses.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .update({ status })
      .eq('id', transaction_id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    await logEvent(supabase, transaction_id, 'STATUS_UPDATED', { new_status: status });

    return res.status(200).json({ status: 'Actualizado', transaction: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 6. Webhook de Pasarela de Pago
app.post('/api/webhooks/payment', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas' });

    const { transaction_id, payment_status, payment_id } = req.body;

    if (!transaction_id || !payment_status) {
      return res.status(400).json({ error: 'Campos requeridos: transaction_id, payment_status' });
    }

    if (['approved', 'completed', 'paid'].includes(payment_status.toLowerCase())) {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .update({ status: 'funded', payment_id: payment_id || null })
        .eq('id', transaction_id)
        .select();

      if (error) return res.status(400).json({ error: error.message });

      await logEvent(supabase, transaction_id, 'PAYMENT_RECEIVED', { payment_id, payment_status });

      return res.status(200).json({ status: 'OK', message: 'Fondos asegurados en Escrow', transaction: data[0] });
    }

    return res.status(200).json({ status: 'Ignorado', message: 'Estado de pago no altera el Escrow' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 7. Abrir Disputa
app.post('/api/escrow/dispute/open', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas' });

    const { transaction_id, opened_by, reason } = req.body;

    if (!transaction_id || !opened_by || !reason) {
      return res.status(400).json({ error: 'Faltan parámetros: transaction_id, opened_by, reason' });
    }

    const { data: tx, error: txError } = await supabase
      .from('escrow_transactions')
      .update({ status: 'disputed' })
      .eq('id', transaction_id)
      .select();

    if (txError) return res.status(400).json({ error: txError.message });

    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .insert([{ transaction_id, opened_by, reason, status: 'open' }])
      .select();

    if (disputeError) return res.status(400).json({ error: disputeError.message });

    await logEvent(supabase, transaction_id, 'DISPUTE_OPENED', { opened_by, reason });

    return res.status(201).json({ status: 'Disputa Abierta', transaction: tx[0], dispute: dispute[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 8. Listar todas las disputas
app.get('/api/escrow/disputes/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas' });

    const { data, error } = await supabase.from('escrow_disputes').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', disputes: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 9. Resolver Disputa (Administrador)
app.post('/api/escrow/dispute/resolve', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas' });

    const { dispute_id, transaction_id, winner_role, resolution_notes } = req.body;

    if (!dispute_id || !transaction_id || !['buyer', 'seller'].includes(winner_role)) {
      return res.status(400).json({ error: 'Parámetros inválidos. winner_role debe ser buyer o seller' });
    }

    const finalStatus = winner_role === 'buyer' ? 'cancelled' : 'completed';

    const { data: tx, error: txError } = await supabase
      .from('escrow_transactions')
      .update({ status: finalStatus })
      .eq('id', transaction_id)
      .select();

    if (txError) return res.status(400).json({ error: txError.message });

    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .update({ 
        status: 'resolved', 
        winner_role, 
        resolution_notes: resolution_notes || '',
        resolved_at: new Date().toISOString() 
      })
      .eq('id', dispute_id)
      .select();

    if (disputeError) return res.status(400).json({ error: disputeError.message });

    await logEvent(supabase, transaction_id, 'DISPUTE_RESOLVED', { winner_role, resolution_notes });

    return res.status(200).json({ status: 'Disputa Resuelta', transaction: tx[0], dispute: dispute[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 10. Consultar Logs de Auditoría de una Transacción
app.get('/api/escrow/logs/:transaction_id', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables de Supabase no configuradas' });

    const { transaction_id } = req.params;
    const { data, error } = await supabase
      .from('escrow_logs')
      .select('*')
      .eq('transaction_id', transaction_id)
      .order('created_at', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', logs: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default app;
    
