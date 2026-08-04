import { Router, Request, Response } from 'express';
import { MASTER_CONFIG } from '../config/master';

const router = Router();

router.post('/create', (req: Request, res: Response) => {
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

export default router;

