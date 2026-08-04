// @ts-nocheck
import { Router, Request, Response } from 'express';
import supabase from '../lib/supabase';
import config from '../config/master';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ status: 'Escrow Engine Active' });
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    if (!config.supabaseUrl || !config.supabaseUrl.startsWith('http')) {
      return res.status(200).json({
        status: 'Configuración Incompleta',
        message: 'Falta configurar SUPABASE_URL en Vercel o la URL no empieza con https://'
      });
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .select('*');

    if (error) {
      return res.status(200).json({
        status: 'Error en Tabla/Supabase',
        message: error.message
      });
    }

    return res.status(200).json({
      status: 'OK',
      transactions: data || []
    });
  } catch (err: any) {
    return res.status(200).json({
      status: 'Error Servidor',
      message: err.message || String(err)
    });
  }
});

export default router;
