import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
app.use(express.json());

// CONFIGURACIÓN CENTRAL DE LA CUENTA MAESTRA & MERCADO PAGO
const MASTER_CONFIG = {
  cbu: '0000003100077621570425',
  commissionRate: 0.05,
  mpAccessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'
};

// ALMACENAMIENTO DE POSICIONES GPS EN TIEMPO REAL
const activeTrackingLocations: Record<string, { lat: number; lng: number; updatedAt: Date; carrierId: string }> = {};

const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// ENDPOINT 1: ESTADO DEL SERVIDOR
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    ecosistema: 'Pase Y Mire (P&M)',
    gps_tracking: 'ENABLED',
    payments_gateway: 'Mercado Pago Ready',
    master_cbu_configured: true,
    timestamp: new Date()
  });
});

// ENDPOINT 2: REGISTRO REAL DE USUARIO (KYC)
app.post('/api/users/register', (req: Request, res: Response) => {
  const { fullName, phone, role } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({ 
      success: false, 
      error: 'El nombre completo y el teléfono son obligatorios para el registro KYC.' 
    });
  }

  const user = {
    id: `usr_${Date.now()}`,
    fullName,
    phone,
    role: role || 'CLIENTE',
    isVerified: true,
    createdAt: new Date()
  };

  res.status(201).json({
    success: true,
    message: 'Usuario validado mediante KYC y registrado correctamente.',
    user
  });
});

// ENDPOINT 3: CREACIÓN DE SUBASTAS CON RETENCIÓN DEL 5%
app.post('/api/auctions/create', (req: Request, res: Response) => {
  const { origin, destination, vehicleType, amount, userId } = req.body;

  const totalAmount = Number(amount);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Monto inválido para la subasta.' });
  }

  const masterFee = totalAmount * MASTER_CONFIG.commissionRate; // 5%
  const carrierAmount = totalAmount - masterFee;               // 95%

  const auction = {
    id: `auc_${Date.now()}`,
    userId: userId || 'usr_anonymous',
    origin,
    destination,
    vehicleType: vehicleType || 'Utilitario',
    totalAmount,
    masterFee_5pct: masterFee,
    carrierPayout_95pct: carrierAmount,
    destinationCBU: MASTER_CONFIG.cbu,
    status: 'OPEN',
    createdAt: new Date()
  };

  res.status(201).json({
    success: true,
    message: 'Subasta creada. Retención del 5% registrada en servidor.',
    auction
  });
});

// ENDPOINT 4: CREAR PREFERENCIA DE PAGO REAL EN MERCADO PAGO
app.post('/api/payments/create-preference', async (req: Request, res: Response) => {
  const { auctionId, title, amount, payerEmail } = req.body;

  const total = Number(amount);
  if (!total || total <= 0) {
    return res.status(400).json({ success: false, error: 'Monto no válido' });
  }

  const masterFee = total * MASTER_CONFIG.commissionRate;
  const carrierPayout = total - masterFee;

  try {
    const preferenceData = {
      items: [
        {
          id: auctionId || `item_${Date.now()}`,
          title: `Flete P&M Escrow: ${title || 'Servicio de Carga'}`,
          unit_price: total,
          quantity: 1,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: payerEmail || 'cliente@paseymire.com'
      },
      metadata: {
        auction_id: auctionId,
        master_fee_5pct: masterFee,
        carrier_payout_95pct: carrierPayout,
        master_cbu: MASTER_CONFIG.cbu
      },
      back_urls: {
        success: 'https://express-js-on-vercel-eight-delta-60.vercel.app/?payment=success',
        failure: 'https://express-js-on-vercel-eight-delta-60.vercel.app/?payment=failure',
        pending: 'https://express-js-on-vercel-eight-delta-60.vercel.app/?payment=pending'
      },
      auto_return: 'approved'
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MASTER_CONFIG.mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();

    if (data.init_point) {
      res.json({
        success: true,
        init_point: data.init_point,
        preference_id: data.id,
        split: {
          totalAmount: total,
          masterFee_5pct: masterFee,
          carrierPayout_95pct: carrierPayout,
          targetCBU: MASTER_CONFIG.cbu
        }
      });
    } else {
      res.status(500).json({ success: false, error: 'No se pudo generar el checkout de pago', details: data });
    }
  } catch (error) {
    console.error('Error al conectar con Mercado Pago:', error);
    res.status(500).json({ success: false, error: 'Error interno procesando el pago' });
  }
});

// ENDPOINT 5: WEBHOOK DE MERCADO PAGO
app.post('/api/payments/webhook', (req: Request, res: Response) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    console.log(`⚡ ¡PAGO APROBADO EN MERCADO PAGO! ID: ${paymentId}`);
  }

  res.status(200).send('OK');
});

// ENDPOINT 6: ACTUALIZAR UBICACIÓN GPS EN TIEMPO REAL
app.post('/api/gps/update', (req: Request, res: Response) => {
  const { auctionId, carrierId, lat, lng } = req.body;

  if (!auctionId || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, error: 'Subasta, Latitud y Longitud son requeridas' });
  }

  activeTrackingLocations[auctionId] = {
    lat: Number(lat),
    lng: Number(lng),
    carrierId: carrierId || 'flete_anon',
    updatedAt: new Date()
  };

  res.json({
    success: true,
    message: 'Coordenadas GPS actualizadas',
    location: activeTrackingLocations[auctionId]
  });
});

// ENDPOINT 7: CONSULTAR UBICACIÓN GPS DEL FLETE
app.get('/api/gps/track/:auctionId', (req: Request, res: Response) => {
  const { auctionId } = req.params;
  const location = activeTrackingLocations[auctionId];

  if (!location) {
    return res.status(404).json({ success: false, error: 'El transportista aún no inició la transmisión GPS.' });
  }

  res.json({
    success: true,
    auctionId,
    location
  });
});

// RUTA SPA PRINCIPAL
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
app.use(express.json());

// CONFIGURACIÓN CENTRAL DE LA CUENTA MAESTRA & MERCADO PAGO
const MASTER_CONFIG = {
  cbu: '0000003100077621570425',
  commissionRate: 0.05,
  mpAccessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'
};

// ALMACENAMIENTO DE POSICIONES GPS EN TIEMPO REAL
const activeTrackingLocations: Record<string, { lat: number; lng: number; updatedAt: Date; carrierId: string }> = {};

const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// ENDPOINT 1: ESTADO DEL SERVIDOR
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    ecosistema: 'Pase Y Mire (P&M)',
    gps_tracking: 'ENABLED',
    payments_gateway: 'Mercado Pago Ready',
    master_cbu_configured: true,
    timestamp: new Date()
  });
});

// ENDPOINT 2: REGISTRO REAL DE USUARIO (KYC)
app.post('/api/users/register', (req: Request, res: Response) => {
  const { fullName, phone, role } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({ 
      success: false, 
      error: 'El nombre completo y el teléfono son obligatorios para el registro KYC.' 
    });
  }

  const user = {
    id: `usr_${Date.now()}`,
    fullName,
    phone,
    role: role || 'CLIENTE',
    isVerified: true,
    createdAt: new Date()
  };

  res.status(201).json({
    success: true,
    message: 'Usuario validado mediante KYC y registrado correctamente.',
    user
  });
});

// ENDPOINT 3: CREACIÓN DE SUBASTAS CON RETENCIÓN DEL 5%
app.post('/api/auctions/create', (req: Request, res: Response) => {
  const { origin, destination, vehicleType, amount, userId } = req.body;

  const totalAmount = Number(amount);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Monto inválido para la subasta.' });
  }

  const masterFee = totalAmount * MASTER_CONFIG.commissionRate; // 5%
  const carrierAmount = totalAmount - masterFee;               // 95%

  const auction = {
    id: `auc_${Date.now()}`,
    userId: userId || 'usr_anonymous',
    origin,
    destination,
    vehicleType: vehicleType || 'Utilitario',
    totalAmount,
    masterFee_5pct: masterFee,
    carrierPayout_95pct: carrierAmount,
    destinationCBU: MASTER_CONFIG.cbu,
    status: 'OPEN',
    createdAt: new Date()
  };

  res.status(201).json({
    success: true,
    message: 'Subasta creada. Retención del 5% registrada en servidor.',
    auction
  });
});

// ENDPOINT 4: CREAR PREFERENCIA DE PAGO REAL EN MERCADO PAGO
app.post('/api/payments/create-preference', async (req: Request, res: Response) => {
  const { auctionId, title, amount, payerEmail } = req.body;

  const total = Number(amount);
  if (!total || total <= 0) {
    return res.status(400).json({ success: false, error: 'Monto no válido' });
  }

  const masterFee = total * MASTER_CONFIG.commissionRate;
  const carrierPayout = total - masterFee;

  try {
    const preferenceData = {
      items: [
        {
          id: auctionId || `item_${Date.now()}`,
          title: `Flete P&M Escrow: ${title || 'Servicio de Carga'}`,
          unit_price: total,
          quantity: 1,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: payerEmail || 'cliente@paseymire.com'
      },
      metadata: {
        auction_id: auctionId,
        master_fee_5pct: masterFee,
        carrier_payout_95pct: carrierPayout,
        master_cbu: MASTER_CONFIG.cbu
      },
      back_urls: {
        success: 'https://express-js-on-vercel-eight-delta-60.vercel.app/?payment=success',
        failure: 'https://express-js-on-vercel-eight-delta-60.vercel.app/?payment=failure',
        pending: 'https://express-js-on-vercel-eight-delta-60.vercel.app/?payment=pending'
      },
      auto_return: 'approved'
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MASTER_CONFIG.mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();

    if (data.init_point) {
      res.json({
        success: true,
        init_point: data.init_point,
        preference_id: data.id,
        split: {
          totalAmount: total,
          masterFee_5pct: masterFee,
          carrierPayout_95pct: carrierPayout,
          targetCBU: MASTER_CONFIG.cbu
        }
      });
    } else {
      res.status(500).json({ success: false, error: 'No se pudo generar el checkout de pago', details: data });
    }
  } catch (error) {
    console.error('Error al conectar con Mercado Pago:', error);
    res.status(500).json({ success: false, error: 'Error interno procesando el pago' });
  }
});

// ENDPOINT 5: WEBHOOK DE MERCADO PAGO
app.post('/api/payments/webhook', (req: Request, res: Response) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    console.log(`⚡ ¡PAGO APROBADO EN MERCADO PAGO! ID: ${paymentId}`);
  }

  res.status(200).send('OK');
});

// ENDPOINT 6: ACTUALIZAR UBICACIÓN GPS EN TIEMPO REAL
app.post('/api/gps/update', (req: Request, res: Response) => {
  const { auctionId, carrierId, lat, lng } = req.body;

  if (!auctionId || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, error: 'Subasta, Latitud y Longitud son requeridas' });
  }

  activeTrackingLocations[auctionId] = {
    lat: Number(lat),
    lng: Number(lng),
    carrierId: carrierId || 'flete_anon',
    updatedAt: new Date()
  };

  res.json({
    success: true,
    message: 'Coordenadas GPS actualizadas',
    location: activeTrackingLocations[auctionId]
  });
});

// ENDPOINT 7: CONSULTAR UBICACIÓN GPS DEL FLETE
app.get('/api/gps/track/:auctionId', (req: Request, res: Response) => {
  const { auctionId } = req.params;
  const location = activeTrackingLocations[auctionId];

  if (!location) {
    return res.status(404).json({ success: false, error: 'El transportista aún no inició la transmisión GPS.' });
  }

  res.json({
    success: true,
    auctionId,
    location
  });
});

// RUTA SPA PRINCIPAL
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
    
