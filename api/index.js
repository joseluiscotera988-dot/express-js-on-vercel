// @ts-nocheck
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Helper para instanciación diferida (evita colapsos de Vercel al arrancar)
const getSupabase = () => {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_KEY || '').trim();
  if (!url || !key || !url.startsWith('http')) return null;
  return createClient(url, key);
};

// Middleware para validación básica de API Key en headers (opcional)
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_SECRET_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    return res.status(401).json({ error: 'No autorizado: API Key inválida o ausente' });
  }
  next();
};

// -----------------------------------------------------------------------------
// 1. SALUD Y ESTADO DEL SERVIDOR
// -----------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor Express + Escrow activo en Vercel' });
});

// -----------------------------------------------------------------------------
// 2. TRANSACCIONES ESCROW (CRUD & ESTADOS)
// -----------------------------------------------------------------------------

// Listar todas las transacciones
app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase incompleta en Vercel' });

    const { data, error } = await supabase.from('escrow_transactions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Obtener una transacción por ID
app.get('/api/escrow/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase incompleta' });

    const { id } = req.params;
    const { data, error } = await supabase.from('escrow_transactions').select('*').eq('id', id).single();

    if (error) return res.status(404).json({ error: 'Transacción no encontrada' });
    return res.status(200).json({ status: 'OK', transaction: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Crear una nueva orden de Escrow
app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase incompleta' });

    const { buyer_id, seller_id, amount, description } = req.body;

    if (!buyer_id || !seller_id || !amount) {
      return res.status(400).json({ error: 'Parámetros obligatorios faltantes: buyer_id, seller_id, amount' });
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .insert([{ buyer_id, seller_id, amount, description, status: 'pending' }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ status: 'Creado', transaction: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Cambiar estado manualmente (Liberar / Cancelar)
app.patch('/api/escrow/status', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase incompleta' });

    const { transaction_id, status } = req.body;
    const validStatuses = ['pending', 'funded', 'completed', 'disputed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', transaction_id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'Actualizado', transaction: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// -----------------------------------------------------------------------------
// 3. PASARELA DE PAGOS & WEBHOOKS
// -----------------------------------------------------------------------------
app.post('/api/webhooks/payment', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase incompleta' });

    const { transaction_id, payment_status, payment_id } = req.body;

    if (!transaction_id || !payment_status) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: transaction_id o payment_status' });
    }

    if (['approved', 'completed', 'paid'].includes(payment_status.toLowerCase())) {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .update({ 
          status: 'funded', 
          payment_id: payment_id || null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', transaction_id)
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ status: 'OK', message: 'Fondos retenidos con éxito', transaction: data[0] });
    }

    return res.status(200).json({ status: 'Ignorado', message: 'El estado del pago no altera la transacción' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// -----------------------------------------------------------------------------
// 4. MÓDULO DE DISPUTAS Y RECLAMOS
// -----------------------------------------------------------------------------

// Abrir una disputa
app.post('/api/escrow/dispute/open', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase incompleta' });

    const { transaction_id, opened_by, reason } = req.body;

    if (!transaction_id || !opened_by || !reason) {
      return res.status(400).json({ error: 'Campos requeridos: transaction_id, opened_by, reason' });
    }

    const { data: tx, error: txError } = await supabase
      .from('escrow_transactions')
      .update({ status: 'disputed', updated_at: new Date().toISOString() })
      .eq('id', transaction_id)
      .select();

    if (txError) return res.status(400).json({ error: txError.message });

    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .insert([{ transaction_id, opened_by, reason, status: 'open' }])
      .select();

    if (disputeError) return res.status(400).json({ error: disputeError.message });

    return res.status(201).json({ status: 'Disputa Abierta', transaction: tx[0], dispute: dispute[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Listar todas las disputas
app.get('/api/escrow/disputes/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase incompleta' });

    const { data, error } = await supabase.from('escrow_disputes').select('*');
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', disputes: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Resolver una disputa (Acción de Administrador)
app.post('/api/escrow/dispute/resolve', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase incompleta' });

    const { dispute_id, transaction_id, winner_role, resolution_notes } = req.body;

    if (!dispute_id || !transaction_id || !['buyer', 'seller'].includes(winner_role)) {
      return res.status(400).json({ error: 'Parámetros inválidos. winner_role debe ser buyer o seller' });
    }

    const finalStatus = winner_role === 'buyer' ? 'cancelled' : 'completed';

    const { data: tx, error: txError } = await supabase
      .from('escrow_transactions')
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
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

    return res.status(200).json({ status: 'Disputa Resuelta', transaction: tx[0], dispute: dispute[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default app;
           
