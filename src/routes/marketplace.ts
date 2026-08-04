import { Router } from 'express';

const router = Router();

// Endpoint de prueba para el módulo Marketplace
router.get('/', (req, res) => {
  res.json({ 
    status: 'Marketplace OK',
    message: 'Módulo de marketplace activo'
  });
});

export default router;
