import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
app.use(express.json());

const MASTER_CONFIG = {
  cbu: '0000003100077621570425',
  commissionRate: 0.05,
  mpAccessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'
};

const activeTrackingLocations: Record<string, { lat: number; lng: number; updatedAt: Date; carrierId: string }> = {};
const qrEscrowTokens: Record<string, { token: string; amount: number; carrierPayout: number; masterFee: number; status: string; createdAt: Date }> = {};

// ALMACENAMIENTO DE MENSAJES DE CHAT POR SUBASTA
const chatMessages: Record<string, Array<{ id: string; sender: string; text: string; timestamp: Date }>> = {};

const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    ecosistema: 'Pase Y Mire (P&M)',
    chat_system: 'ENABLED',
    gps_tracking: 'ENABLED',
    qr_escrow_security: 'ENABLED',
    payments_gateway: 'Mercado Pago Ready',
    timestamp: new Date()
  });
});

app.post('/api/users/register', (req: Request, res: Response) => {
  const { fullName, phone, role } = req.body;
  if (!fullName || !phone) {
    return res.status(400).json({ success: false, error: 'Nombre y teléfono requeridos.' });
  }
  res.status(201).json({
    success: true,
    user: { id: `usr_${Date.now()}`, fullName, phone, role: role || 'CLIENTE', isVerified: true }
  });
});

app.post('/api/auctions/create', (req: Request, res: Response) => {
  const { origin, destination, vehicleType, amount, userId } = req.body;
  const totalAmount = Number(amount) || 0;
  const masterFee = totalAmount * MASTER_CONFIG.commissionRate;
  const carrierAmount = totalAmount - masterFee;

  res.status(201).json({
    success: true,
    auction: {
      id: `auc_${Date.now()}`,
      userId: userId || 'usr_anon',
      origin,
      destination,
      vehicleType: vehicleType || 'Utilitario',
      totalAmount,
      masterFee_5pct: masterFee,
      carrierPayout_95pct: carrierAmount,
      destinationCBU: MASTER_CONFIG.cbu,
      status: 'OPEN'
    }
  });
});

app.post('/api/payments/create-preference', async (req: Request, res: Response) => {
  const { auctionId, title, amount, payerEmail } = req.body;
  const total = Number(amount) || 0;
  const masterFee = total * MASTER_CONFIG.commissionRate;
  const carrierPayout = total - masterFee;

  try {
    const preferenceData = {
      items: [{ id: auctionId || `item_${Date.now()}`, title: `Flete P&M: ${title || 'Servicio'}`, unit_price: total, quantity: 1, currency_id: 'ARS' }],
      payer: { email: payerEmail || 'cliente@paseymire.com' },
      back_urls: {
        success: 'https://express-js-on-vercel-pym2.vercel.app/?payment=success',
        failure: 'https://express-js-on-vercel-pym2.vercel.app/?payment=failure'
      },
      auto_return: 'approved'
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MASTER_CONFIG.mpAccessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();
    if (data.init_point) {
      res.json({ success: true, init_point: data.init_point, split: { totalAmount: total, masterFee_5pct: masterFee, carrierPayout_95pct: carrierPayout } });
    } else {
      res.status(500).json({ success: false, error: 'No se pudo generar checkout.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error en pasarela de pago.' });
  }
});

app.post('/api/gps/update', (req: Request, res: Response) => {
  const { auctionId, carrierId, lat, lng } = req.body;
  activeTrackingLocations[auctionId] = { lat: Number(lat), lng: Number(lng), carrierId: carrierId || 'anon', updatedAt: new Date() };
  res.json({ success: true, location: activeTrackingLocations[auctionId] });
});

app.post('/api/escrow/generate-qr', (req: Request, res: Response) => {
  const { auctionId, amount } = req.body;
  const total = Number(amount) || 50000;
  const token = `QR_${Date.now()}`;
  qrEscrowTokens[auctionId] = { token, amount: total, carrierPayout: total * 0.95, masterFee: total * 0.05, status: 'PENDING', createdAt: new Date() };

  res.json({
    success: true,
    releaseToken: token,
    qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}`,
    details: { totalAmount: total, carrierPayout_95: total * 0.95, masterFee_5: total * 0.05 }
  });
});

app.post('/api/escrow/release', (req: Request, res: Response) => {
  const { releaseToken } = req.body;
  const key = Object.keys(qrEscrowTokens).find(k => qrEscrowTokens[k].token === releaseToken);
  if (!key) return res.status(404).json({ success: false, error: 'QR Inválido' });

  qrEscrowTokens[key].status = 'RELEASED';
  res.json({ success: true, message: 'Pago Escrow Liberado', details: qrEscrowTokens[key] });
});

// ENDPOINTS CHAT EN TIEMPO REAL
app.get('/api/chat/:auctionId', (req: Request, res: Response) => {
  const { auctionId } = req.params;
  res.json({ success: true, messages: chatMessages[auctionId] || [] });
});

app.post('/api/chat/send', (req: Request, res: Response) => {
  const { auctionId, sender, text } = req.body;
  if (!auctionId || !text) {
    return res.status(400).json({ success: false, error: 'Subasta y mensaje son requeridos.' });
  }

  if (!chatMessages[auctionId]) {
    chatMessages[auctionId] = [];
  }

  const newMessage = {
    id: `msg_${Date.now()}`,
    sender: sender || 'Usuario',
    text,
    timestamp: new Date()
  };

  chatMessages[auctionId].push(newMessage);
  res.status(201).json({ success: true, message: newMessage });
});

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
  
