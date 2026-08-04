import { Router, Request, Response } from 'express';
import supabase from '../lib/supabase';

const router = Router();

// Estado del módulo
router.get('/', (req: Request, res: Response) => {
  res.json({ status: 'Escrow Engine Active' });
});

// 1. Crear nueva transacción en Escrow
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { buyer_id, seller_id, title, description, amount, currency } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: title y amount' });
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .insert([
        {
          buyer_id: buyer_id || null,
          seller_id: seller_id || null,
          title,
          description,
          amount,
          currency: currency || 'ARS',
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Transacción Escrow creada exitosamente',
      transaction: data
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al crear la transacción' });
  }
});

// 2. Obtener todas las transacciones
router.get('/all', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('escrow_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ transactions: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Consultar una transacción por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    res.json({ transaction: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Liberar fondos (Completar orden)
router.post('/:id/release', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('escrow_transactions')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Fondos liberados al vendedor exitosamente',
      transaction: data
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
        
