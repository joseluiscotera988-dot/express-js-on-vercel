const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());

// Servir la interfaz estática real
app.use(express.static(path.join(__dirname, '../')));

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let mpClient = null;
if (MP_ACCESS_TOKEN) {
  mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
}

// Configuración pública
app.get('/api/config', (req, res) => {
  res.json({ supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY });
});

// Mercado Pago Preference
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

// Órdenes generales
app.get('/api/orders', async (req, res) => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Radar Logística Choferes
app.get('/api/driver/available-shipments', async (req, res) => {
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
  const { order_id, driver_id } = req.body;
  const { data, error } = await supabase
    .from('orders')
    .update({ driver_id: driver_id, status: 'chofer_asignado' })
    .eq('id', order_id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, order: data[0] });
});

// Admin & Disputas
app.get('/api/disputes', async (req, res) => {
  const { data, error } = await supabase.from('disputes').select('*, orders(*)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/disputes', async (req, res) => {
  const { order_id, complainant_id, reason } = req.body;
  await supabase.from('disputes').insert([{ order_id, complainant_id, reason }]);
  await supabase.from('orders').update({ status: 'en_disputa' }).eq('id', order_id);
  res.json({ success: true });
});

app.post('/api/admin/resolve-dispute', async (req, res) => {
  const { dispute_id, order_id, resolution } = req.body;
  await supabase.from('orders').update({ status: resolution }).eq('id', order_id);
  await supabase.from('disputes').update({ status: resolution === 'reembolsado' ? 'resuelta_reembolso' : 'resuelta_liberacion' }).eq('id', dispute_id);
  res.json({ success: true });
});

app.get('/api/admin/kyc-docs', async (req, res) => {
  const { data, error } = await supabase.from('kyc_documents').select('*, profiles(nombre, apellido, email, rol)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/admin/kyc-status', async (req, res) => {
  const { doc_id, user_id, status } = req.body;
  await supabase.from('kyc_documents').update({ status }).eq('id', doc_id);
  if (status === 'aprobado') {
    await supabase.from('profiles').update({ kyc_status: 'verificado' }).eq('id', user_id);
  }
  res.json({ success: true });
});

// Capturar cualquier otra ruta y servir la app principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

module.exports = app;
            
