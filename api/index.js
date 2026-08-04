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

// 1. Estado de la API
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor Express activo en Vercel' });
});

// 2. Obtener todas las transacciones
app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta' });

    const { data, error } = await supabase.from('escrow_transactions').select('*');
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 3. Crear nueva transacción
app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta' });

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

// 4. Cambiar estado (Fondo acreditado / Liberación de fondos / Disputa)
app.patch('/api/escrow/status', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta' });

    const { transaction_id, status } = req.body;
    const validStatuses = ['pending', 'funded', 'completed', 'disputed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .update({ status, updated_at: new Date() })
      .eq('id', transaction_id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'Actualizado', transaction: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default app;
      
