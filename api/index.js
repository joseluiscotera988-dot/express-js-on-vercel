const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());

// Variables de Entorno en Vercel
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || ''; // Clave secreta de Mercado Pago

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Inicializar Mercado Pago (Si hay Access Token configurado)
let mpClient = null;
if (MP_ACCESS_TOKEN) {
  mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
}

// Configuración pública para el Frontend
app.get('/api/config', (req, res) => {
  res.json({ 
    supabaseUrl: SUPABASE_URL, 
    supabaseKey: SUPABASE_KEY,
    mpPublicKey: process.env.MP_PUBLIC_KEY || ''
  });
});

// 1. CREAR PREFERENCIA DE PAGO EN MERCADO PAGO
app.post('/api/create-preference', async (req, res) => {
  const { order_id, title, price, shipping_cost } = req.body;
  const itemPrice = Number(price);
  const shipCost = Number(shipping_cost) || 0;
  const total = itemPrice + shipCost;
  const commission = total * 0.03; // 3% comisión de Escrow

  if (!mpClient) {
    return res.status(400).json({ error: 'Falta configurar MP_ACCESS_TOKEN en las variables de entorno de Vercel.' });
  }

  try {
    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: [
          {
            id: order_id,
            title: `EscrowGuard: ${title}`,
            unit_price: total + commission,
            quantity: 1,
            currency_id: 'ARS'
          }
        ],
        external_reference: order_id,
        notification_url: `https://${req.headers.host}/api/webhook/mercadopago`,
        back_urls: {
          success: `https://${req.headers.host}/?status=success&order_id=${order_id}`,
          failure: `https://${req.headers.host}/?status=failure`,
          pending: `https://${req.headers.host}/?status=pending`
        },
        auto_return: 'approved'
      }
    });

    res.json({ preferenceId: response.id, init_point: response.init_point });
  } catch (err) {
    console.error("Error creando preferencia MP:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. WEBHOOK: NOTIFICACIÓN EN TIEMPO REAL DE PAGO APROBADO
app.post('/api/webhook/mercadopago', async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment' && data && data.id) {
    try {
      // 1. Marcar la orden asociada como 'fondos_retendidos' en Supabase
      const paymentId = data.id;
      
      // Actualizar transacción si viene el external_reference
      if (req.query['data.id']) {
        await supabase
          .from('orders')
          .update({ status: 'fondos_retendidos' })
          .eq('id', req.body.external_reference);
      }
    } catch (err) {
      console.error("Error procesando Webhook MP:", err);
    }
  }

  res.sendStatus(200);
});

// OBTENER Y ACTUALIZAR ÓRDENES
app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
