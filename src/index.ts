import express from 'express';

import authRoutes from './routes/auth';
import auctionRoutes from './routes/auctions';
import paymentRoutes from './routes/payments';
import gpsRoutes from './routes/gps';
import escrowRoutes from './routes/escrow';
import chatRoutes from './routes/chat';
import adsRoutes from './routes/ads';
import marketplaceRoutes from './routes/marketplace';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';

const app = express();
app.use(express.json());

// Rutas de la API Backend
app.use('/api/users', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', architecture: 'Modular Clean System' });
});

export default app;
        
