const express = require('express');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.error("Error Supabase:", e);
  }
}

let mpClient = null;
if (MP_ACCESS_TOKEN) {
  try {
    mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
  } catch (e) {
    console.error("Error MP:", e);
  }
}

// 1. CONFIGURACIÓN PÚBLICA
app.get('/api/config', (req, res) => {
  res.json({ supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY });
});

// 2. CREAR PREFERENCIA MERCADO PAGO
app.post('/api/create-preference', async (req, res) => {
  const { order_id, title, price, shipping_cost } = req.body;
  const total = Number(price) + Number(shipping_cost) + ((Number(price) + Number(shipping_cost)) * 0.03);

  if (!mpClient) return res.status(400).json({ error: 'Falta configurar MP_ACCESS_TOKEN' });

  try {
    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: [{ id: order_id, title: `Pase Y Mire: ${title}`, unit_price: total, quantity: 1, currency_id: 'ARS' }],
        external_reference: order_id,
        back_urls: {
          success: `https://${req.headers.host}/?status=success`,
          failure: `https://${req.headers.host}/?status=failure`,
          pending: `https://${req.headers.host}/?status=pending`
        },
        auto_return: 'approved'
      }
    });
    res.json({ preferenceId: response.id, init_point: response.init_point });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ÓRDENES
app.get('/api/orders', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no configurada' });
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// 4. RADAR LOGÍSTICA
app.get('/api/driver/available-shipments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no configurada' });
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'fondos_retendidos')
    .is('driver_id', null)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/driver/accept-shipment', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no configurada' });
  const { order_id, driver_id } = req.body;
  const { data, error } = await supabase
    .from('orders')
    .update({ driver_id: driver_id, status: 'chofer_asignado' })
    .eq('id', order_id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, order: data ? data[0] : null });
});

// 5. DISPUTAS Y ADMIN
app.get('/api/disputes', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no configurada' });
  const { data, error } = await supabase.from('disputes').select('*, orders(*)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/disputes', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no configurada' });
  const { order_id, complainant_id, reason } = req.body;
  await supabase.from('disputes').insert([{ order_id, complainant_id, reason }]);
  await supabase.from('orders').update({ status: 'en_disputa' }).eq('id', order_id);
  res.json({ success: true });
});

app.post('/api/admin/resolve-dispute', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no configurada' });
  const { dispute_id, order_id, resolution } = req.body;
  await supabase.from('orders').update({ status: resolution }).eq('id', order_id);
  await supabase.from('disputes').update({ status: resolution === 'reembolsado' ? 'resuelta_reembolso' : 'resuelta_liberacion' }).eq('id', dispute_id);
  res.json({ success: true });
});

app.get('/api/admin/kyc-docs', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no configurada' });
  const { data, error } = await supabase.from('kyc_documents').select('*, profiles(nombre, apellido, email, rol)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/admin/kyc-status', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'DB no configurada' });
  const { doc_id, user_id, status } = req.body;
  await supabase.from('kyc_documents').update({ status }).eq('id', doc_id);
  if (status === 'aprobado') {
    await supabase.from('profiles').update({ kyc_status: 'verificado' }).eq('id', user_id);
  }
  res.json({ success: true });
});

// 6. SERVIR INTERFAZ PRINCIPAL PASE Y MIRE
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    try {
      const htmlPath = path.join(process.cwd(), 'index.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }
    } catch (e) {
      return res.status(500).send("Error al cargar la interfaz de Pase Y Mire.");
    }
  }
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;
                              
