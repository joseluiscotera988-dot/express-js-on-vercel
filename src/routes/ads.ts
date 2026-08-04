import { Router, Request, Response } from 'express';

const router = Router();
const adBanners = [
  { id: 'ad_1', title: 'Publicidad Central P&M', subtitle: '100% acreditado en CBU Maestro', link: '#', active: true }
];

router.get('/', (req: Request, res: Response) => {
  res.json({ success: true, ads: adBanners });
});

router.post('/create', (req: Request, res: Response) => {
  const { title, subtitle, link } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'Título requerido.' });

  const newAd = { id: `ad_${Date.now()}`, title, subtitle: subtitle || 'Sponsor Oficial P&M', link: link || '#', active: true };
  adBanners.unshift(newAd);

  res.status(201).json({ success: true, message: 'Anuncio publicado.', ad: newAd });
});

export default router;

