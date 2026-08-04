import { Router } from 'express';

const router = Router();

// Endpoint de prueba para Webhooks
router.get('/', (req, res) => {
  res.json({ 
    status: 'Webhooks OK',
    message: 'Módulo de webhooks activo'
  });
});

export default router;
