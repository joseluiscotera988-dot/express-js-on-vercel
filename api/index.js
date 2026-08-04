// @ts-nocheck
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Verificar estado del servidor
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor Express activo en Vercel' });
});

// Obtener todas las transacciones de Escrow
app.get('/api/escrow/all', async (req, res) => {
  try {
    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_KEY || '').trim();

    if (!url || !url.startsWith('http') || !key) {
      return res.status(200).json({
        status: 'Configuración Incompleta',
        message: 'Falta configurar SUPABASE_URL o SUPABASE_KEY en Vercel.'
      });
    }

    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('escrow_transactions').select('*');

    if (error) {
      return res.status(200).json({ status: 'Error de Supabase', message: error.message });
    }

    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(200).json({ status: 'Error Interno', message: err.message || String(err) });
  }
});

// Crear una nueva orden de Escrow (POST)
app.post('/api/escrow/create', async (req, res) => {
  try {
    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_KEY || '').trim();

    if (!url || !key) {
      return res.status(400).json({ error: 'Configuración de Supabase no encontrada en el servidor' });
    }

    const { buyer_id, seller_id, amount, description } = req.body;
    const supabase = createClient(url, key);

    const { data, error } = await supabase
      .from('escrow_transactions')
      .insert([{ buyer_id, seller_id, amount, description, status: 'pending' }])
      .select();

    if (error) {
      return res.status(400).json({ status: 'Error', message: error.message });
    }

    return res.status(201).json({ status: 'Creado', transaction: data[0] });
  } catch (err: any) {
    return res.status(500).json({ status: 'Error Interno', message: err.message || String(err) });
  }
});

export default app;
    
