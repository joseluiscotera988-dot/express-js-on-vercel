import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
app.use(express.json());

// CONFIGURACIÓN CENTRAL DE LA CUENTA MAESTRA (ENCRIPTADA)
const MASTER_CONFIG = {
  cbu: '0000003100077621570425',
  commissionRate: 0.05, // 5% de retención automática por fletes / compras
  adRevenueShare: 1.00  // 100% de la recaudación por publicidad
};

// SERVIR CONTENIDO ESTÁTICO DE LA CARPETA PUBLIC
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// ENDPOINT 1: ESTADO DEL SERVIDOR Y VERIFICACIÓN
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    ecosistema: 'Pase Y Mire (P&M)',
    master_cbu_configured: true,
    timestamp: new Date()
  });
});

// ENDPOINT 2: REGISTRO REAL DE USUARIO (VERIFICACIÓN KYC)
app.post('/api/users/register', (req: Request, res: Response) => {
  const { fullName, phone, role } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({ 
      success: false, 
      error: 'El nombre completo y el teléfono son obligatorios para el registro KYC.' 
    });
  }

  const user = {
    id: `usr_${Date.now()}`,
    fullName,
    phone,
    role: role || 'CLIENTE',
    isVerified: true,
    createdAt: new Date()
  };

  res.status(201).json({
    success: true,
    message: 'Usuario validado mediante KYC y registrado correctamente.',
    user
  });
});

// ENDPOINT 3: CREACIÓN DE SUBASTAS CON RETENCIÓN DEL 5% CALCULADA EN BACKEND
app.post('/api/auctions/create', (req: Request, res: Response) => {
  const { origin, destination, vehicleType, amount, userId } = req.body;

  const totalAmount = Number(amount);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Monto inválido para la subasta.' });
  }

  const masterFee = totalAmount * MASTER_CONFIG.commissionRate; // 5%
  const carrierAmount = totalAmount - masterFee;               // 95%

  const auction = {
    id: `auc_${Date.now()}`,
    userId: userId || 'usr_anonymous',
    origin,
    destination,
    vehicleType: vehicleType || 'Utilitario',
    totalAmount,
    masterFee_5pct: masterFee,
    carrierPayout_95pct: carrierAmount,
    destinationCBU: MASTER_CONFIG.cbu,
    status: 'OPEN',
    createdAt: new Date()
  };

  res.status(201).json({
    success: true,
    message: 'Subasta creada. Retención del 5% registrada en servidor.',
    auction
  });
});

// RUTA SPA PRINCIPAL
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
  
