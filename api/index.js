import express from 'express';
import escrowRouter from './routes/escrow';
import marketplaceRouter from './routes/marketplace';

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor Express activo en Vercel'
  });
});

// Chequeo de estado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Módulos
app.use('/api/escrow', escrowRouter);
app.use('/api/marketplace', marketplaceRouter);

export default app;
