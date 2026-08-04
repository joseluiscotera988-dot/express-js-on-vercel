// @ts-nocheck
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const getSupabase = () => {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_KEY || '').trim();
  if (!url || !key) return null;
  return createClient(url, key);
};

// 1. Check de estado
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor Express activo en Vercel' });
});

// 2. Obtener todas las transacciones
app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta de Supabase' });

    const { data, error } = await supabase.from('escrow_transactions').select('*');
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 3. Crear nueva orden de Escrow
app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta de Supabase' });

    const { buyer_id, seller_id, amount, description } = req.body;
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

// 4. Cambiar estado manualmente (Liberar / Disputar / Cancelar)
app.patch('/api/escrow/status', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta de Supabase' });

    const { transaction_id, status } = req.body;
    const validStatuses = ['pending', 'funded', 'completed', 'disputed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
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

// 5. Webhook de Pasarela (Acreditación Automática a 'funded')
app.post('/api/webhooks/payment', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta de Supabase' });

    const { transaction_id, payment_status, payment_id } = req.body;

    // Si el pago fue aprobado/acreditado
    if (payment_status === 'approved' || payment_status === 'completed') {
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

      return res.status(200).json({ 
        status: 'OK', 
        message: 'Transacción financiada correctamente',
        transaction: data[0] 
      });
    }

    return res.status(200).json({ status: 'Ignorado', message: 'Estado de pago no requiere acción' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default app;
    
