import express, { Request, Response } from 'express';
import path from 'path';

const app = express();

app.use(express.json());

// CONFIGURACIÓN DE LA CUENTA MAESTRA & RECAUDACIÓN (ENCRIPTADA EN SERVER)
const MASTER_FINANCIAL_CONFIG = {
  destinationCBU: '0000003100077621570425',
  commissionRate: 0.05, // 5% fletes y compras
  adRevenueShare: 1.00, // 100% de publicidad
  adminRole: 'ROOT_MASTER'
};

// Servir archivos estáticos de la carpeta public (HTML, CSS, JS, imágenes)
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// API de verificación de estado del Ecosistema
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    ecosystem: 'Pase Y Mire (P&M)',
    escrowProtection: true,
    masterAccountConfigured: true,
    timestamp: new Date()
  });
});

// Ruta principal para servir el index.html
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
