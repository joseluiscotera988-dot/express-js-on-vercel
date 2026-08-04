import express, { Request, Response, NextFunction } from 'express';
import escrowRouter from './routes/escrow';
import marketplaceRouter from './routes/marketplace';
import webhooksRouter from './routes/webhooks';
import config from './config/master';

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Ruta principal
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    app: config.appName,
    message: 'Servidor Express activo en Vercel'
  });
});

// Chequeo de estado del sistema
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// Enrutador de módulos
app.use('/api/escrow', escrowRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/webhooks', webhooksRouter);

// Manejo de rutas no encontradas (404 personalizado)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta '${req.originalUrl}' no existe en este servidor.`
  });
});

// Middleware global para manejo de errores (500)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Ocurrió un error inesperado en el servidor.'
  });
});

export default app;
