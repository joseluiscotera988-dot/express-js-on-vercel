import { Router, Request, Response } from 'express';

const router = Router();

router.post('/mercadopago', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      console.log(`[P&M WEBHOOK] Notificación de pago recibida ID: ${data.id}`);
      // Mercado Pago notifica aquí la confirmación del pago
      // La comisión del 5% queda registrada automáticamente en Escrow
    }

    // Mercado Pago requiere siempre respuesta 200 OK
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send('Webhook Error');
  }
});

export default router;
  
