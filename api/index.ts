import express from 'express';

import authRoutes from '../src/routes/auth';
import auctionRoutes from '../src/routes/auctions';
import paymentRoutes from '../src/routes/payments';
import gpsRoutes from '../src/routes/gps';
import escrowRoutes from '../src/routes/escrow';
import chatRoutes from '../src/routes/chat';
import adsRoutes from '../src/routes/ads';
import marketplaceRoutes from '../src/routes/marketplace';
import webhookRoutes from '../src/routes/webhooks';
import adminRoutes from '../src/routes/admin';

const app = express();
app.use(express.json());

// Enrutadores de la API
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

  
