import { Router, Request, Response } from 'express';
import { MASTER_CONFIG } from '../config/master';

const router = Router();

// Listado inicial de productos en el Marketplace P&M
const marketItems = [
  { id: 'item_1', title: 'Batería 12V Reforzada', price: 85000, seller: 'Repuestos San Pedro', category: 'Vehículos' },
  { id: 'item_2', title: 'Aceite Sintético 5W40', price: 42000, seller: 'Lubricentro Total', category: 'Insumos' }
];

router.get('/items', (req: Request, res: Response) => {
  res.json({ success: true, items: marketItems });
});

router.post('/create', (req: Request, res: Response) => {
  const { title, price, seller, category } = req.body;
  if (!title || !price) {
    return res.status(400).json({ success: false, error: 'Título y precio son requeridos.' });
  }

  const numericPrice = Number(price);
  const masterFee = numericPrice * MASTER_CONFIG.commissionRate;
  const sellerPayout = numericPrice - masterFee;

  const newItem = {
    id: `item_${Date.now()}`,
    title,
    price: numericPrice,
    seller: seller || 'Comercial P&M',
    category: category || 'General',
    masterFee_5pct: masterFee,
    sellerPayout_95pct: sellerPayout,
    destinationCBU: MASTER_CONFIG.cbu
  };

  marketItems.unshift(newItem);
  res.status(201).json({ success: true, item: newItem });
});

export default router;
      
