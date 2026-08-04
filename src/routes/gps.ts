import { Router, Request, Response } from 'express';

const router = Router();
const activeLocations: Record<string, { lat: number; lng: number; updatedAt: Date; carrierId: string }> = {};

router.post('/update', (req: Request, res: Response) => {
  const { auctionId, carrierId, lat, lng } = req.body;
  if (!auctionId || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, error: 'Coordenadas requeridas.' });
  }

  activeLocations[auctionId] = {
    lat: Number(lat),
    lng: Number(lng),
    carrierId: carrierId || 'flete_anon',
    updatedAt: new Date()
  };

  res.json({ success: true, location: activeLocations[auctionId] });
});

router.get('/track/:auctionId', (req: Request, res: Response) => {
  const location = activeLocations[req.params.auctionId];
  if (!location) return res.status(404).json({ success: false, error: 'Sin transmisión GPS activo.' });
  res.json({ success: true, location });
});

export default router;
  
