const express = require('express');
const app = express();

app.use(express.json());

// CONFIGURACIÓN CENTRAL CBU MAESTRO
const MASTER_CONFIG = {
  cbu: '0000003100077621570425',
  commissionRate: 0.05,
  mpAccessToken: 'APP_USR-7022067749069503-080313-b54131df3fe4d2df4dbe75f10643ea1b-260173671'
};

// 1. CHEQUEO DE SALUD
app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', engine: 'Vercel Node.js Native' });
});

// 2. AUTENTICACIÓN
app.post('/api/users/register', (req, res) => {
  const { fullName, phone, role } = req.body;
  res.status(201).json({ success: true, user: { id: `usr_${Date.now()}`, fullName, phone, role: role || 'CLIENTE' } });
});

app.post('/api/users/login', (req, res) => {
  const { phone } = req.body;
  res.json({ success: true, user: { id: `usr_${Date.now()}`, name: 'Usuario Registrado', phone } });
});

// 3. SUBASTAS Y FLETES
app.post('/api/auctions/create', (req, res) => {
  const { origin, destination, amount } = req.body;
  const totalAmount = Number(amount) || 0;
  const masterFee = totalAmount * MASTER_CONFIG.commissionRate;
  res.status(201).json({
    success: true,
    auction: {
      id: `auc_${Date.now()}`,
      origin, destination,
      totalAmount,
      masterFee_5pct: masterFee,
      carrierPayout_95pct: totalAmount - masterFee,
      destinationCBU: MASTER_CONFIG.cbu
    }
  });
});

// 4. MERCADO PAGO SPLIT
app.post('/api/payments/create-preference', async (req, res) => {
  const { auctionId, title, amount, payerEmail } = req.body;
  const total = Number(amount) || 0;
  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MASTER_CONFIG.mpAccessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: auctionId || `item_${Date.now()}`, title: `P&M: ${title || 'Servicio'}`, unit_price: total, quantity: 1, currency_id: 'ARS' }],
        payer: { email: payerEmail || 'cliente@paseymire.com' },
        auto_return: 'approved'
      })
    });
    const data = await response.json();
    if (data.init_point) res.json({ success: true, init_point: data.init_point });
    else res.status(500).json({ success: false, error: 'Error en preferencia' });
  } catch (err) { res.status(500).json({ success: false, error: 'Error de conexion' }); }
});

// 5. METRICAS ADMIN CBU
app.get('/api/admin/metrics', (req, res) => {
  res.json({ success: true, cbuMaestro: MASTER_CONFIG.cbu, tasaRetencion: '5%', estadoMotor: 'OPERATIVO' });
});

module.exports = app;
                                               
