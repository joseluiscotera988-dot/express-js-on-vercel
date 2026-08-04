import express from 'express';
import escrowRouter from './routes/escrow';

const app = express();

// Middleware para entender JSON en las peticiones
app.use(express.json());

// Ruta principal de inicio (raíz '/')
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor Express activo en Vercel'
  });
});

// Ruta de estado de la API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Rutas de módulos
app.use('/api/escrow', escrowRouter);

export default app;
