import { Router, Request, Response } from 'express';
import { MASTER_CONFIG } from '../config/master';

const router = Router();

// Muestra las métricas generales de recaudación del CBU Maestro
router.get('/metrics', (req: Request, res: Response) => {
  const sampleTotalVolume = 1450000; // $1.450.000 procesados en la red
  const masterEarnings = sampleTotalVolume * MASTER_CONFIG.commissionRate;

  res.json({
    success: true,
    cbuMaestro: MASTER_CONFIG.cbu,
    tasaRetencion: '5%',
    volumenTotalTransaccionado: sampleTotalVolume,
    recaudacionBrutaCBU: masterEarnings,
    estadoMotor: 'OPERATIVO_EN_TIEMPO_REAL'
  });
});

export default router;

