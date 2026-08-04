import { Router, Request, Response } from 'express';
import { MASTER_CONFIG } from '../config/master';

const router = Router();

router.post('/create-preference', async (req: Request, res: Response) => {
  const { auctionId, title, amount, payerEmail } = req.body;
  const total = Number(amount) || 0;
  const masterFee = total * MASTER_CONFIG.commissionRate;
  const carrierPayout = total - masterFee;

  try {
    const preferenceData = {
      items: [{
        id: auctionId || `item_${Date.now()}`,
        title: `Flete P&M: ${title || 'Servicio'}`,
        unit_price: total,
        quantity: 1,
        currency_id: 'ARS'
      }],
      payer: { email: payerEmail || 'cliente@paseymire.com' },
      back_urls: {
        success: 'https://express-js-on-vercel-pym2.vercel.app/?payment=success',
        failure: 'https://express-js-on-vercel-pym2.vercel.app/?payment=failure'
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
      res.json({ success: true, init_point: data.init_point, split: { totalAmount: total, masterFee_5pct: masterFee, carrierPayout_95pct: carrierPayout } });
    } else {
      res.status(500).json({ success: false, error: 'No se pudo generar preferencia de Mercado Pago.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error en servidor conectando con pasarela.' });
  }
});

export default router;
        
