import { Router, Request, Response } from 'express';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { fullName, phone, role } = req.body;
  if (!fullName || !phone) {
    return res.status(400).json({ success: false, error: 'Nombre y teléfono son requeridos.' });
  }

  res.status(201).json({
    success: true,
    user: {
      id: `usr_${Date.now()}`,
      fullName,
      phone,
      role: role || 'CLIENTE',
      isVerified: true
    }
  });
});

export default router;

