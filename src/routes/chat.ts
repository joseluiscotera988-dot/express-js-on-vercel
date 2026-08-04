import { Router, Request, Response } from 'express';

const router = Router();
const chatMessages: Record<string, Array<{ id: string; sender: string; text: string; timestamp: Date }>> = {};

router.get('/:auctionId', (req: Request, res: Response) => {
  res.json({ success: true, messages: chatMessages[req.params.auctionId] || [] });
});

router.post('/send', (req: Request, res: Response) => {
  const { auctionId, sender, text } = req.body;
  if (!auctionId || !text) return res.status(400).json({ success: false, error: 'Datos incompletos.' });

  if (!chatMessages[auctionId]) chatMessages[auctionId] = [];
  const msg = { id: `msg_${Date.now()}`, sender: sender || 'Usuario', text, timestamp: new Date() };
  chatMessages[auctionId].push(msg);

  res.status(201).json({ success: true, message: msg });
});

export default router;

