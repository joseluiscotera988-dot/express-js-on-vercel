// @ts-nocheck
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Ruta raíz de verificación básica
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor Express activo en Vercel' });
});

// Ruta Escrow con instanciación diferida
app.get('/api/escrow/all', async (req, res) => {
  try {
    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_KEY || '').trim();

    if (!url || !url.startsWith('http') || !key) {
      return res.status(200).json({
        status: 'Configuración Incompleta',
        message: 'Falta SUPABASE_URL (debe comenzar con https://) o SUPABASE_KEY en las variables de Vercel.'
      });
    }

    // Supabase se crea ÚNICAMENTE al recibir la petición, nunca al arrancar la app
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

export default app;
    
