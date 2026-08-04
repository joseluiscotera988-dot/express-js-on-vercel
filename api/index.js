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

// Ruta principal en HTML nativo limpio
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Escrow System</title>
      <style>
        body { font-family: sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; }
        .card { background: #161b22; border: 1px solid #30363d; padding: 15px; border-radius: 8px; margin-top: 15px; }
        a { color: #58a6ff; }
      </style>
    </head>
    <body>
      <h1>🛡️ Escrow API Status</h1>
      <div class="card">
        <p><strong>Estado:</strong> Servidor activo sin errores de compilación.</p>
        <p><a href="/api/escrow/all">Ver Transacciones (/api/escrow/all)</a></p>
      </div>
    </body>
    </html>
  `);
});

// Endpoint de prueba de la base de datos
app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Faltan las variables SUPABASE_URL y SUPABASE_KEY en Vercel' });
    }
    const { data, error } = await supabase.from('escrow_transactions').select('*');
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default app;
