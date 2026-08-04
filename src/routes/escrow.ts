import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'Escrow OK' });
});

export default router;

