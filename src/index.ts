import express from 'express';
import escrowRouter from './routes/escrow';
import marketplaceRouter from './routes/marketplace';
import webhooksRouter from './routes/webhooks';

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor Express activo en Vercel'
  });
});

// Chequeo de estado del sistema
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Enrutador de módulos
app.use('/api/escrow', escrowRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/webhooks', webhooksRouter);

export default app;
