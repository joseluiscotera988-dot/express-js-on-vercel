import { Router, Request, Response } from 'express';
import supabase from '../lib/supabase';

const router = Router();

// Endpoint base del módulo Escrow
router.get('/', (req: Request, res: Response) => {
  res.json({ 
    status: 'Escrow OK',
    message: 'Módulo de escrow activo'
  });
});

// Endpoint de prueba para verificar la conexión con Supabase
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    // Intentamos verificar la sesión/conexión básica con Supabase
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return res.status(400).json({
        status: 'Error Supabase',
        error: error.message
      });
    }

    res.json({
      status: 'OK',
      message: 'Conexión exitosa con Supabase',
      session: data
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'Error interno',
      error: err.message || 'Error al conectar con la base de datos'
    });
  }
});

export default router;
