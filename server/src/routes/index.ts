import { Router } from 'express';
import mongoose from 'mongoose';
import orderRoutes from './order.routes.js';
import customerRoutes from './customer.routes.js';
import storeRoutes from './store.routes.js';
import shipperRoutes from './shipper.routes.js';
import reviewRoutes from './review.routes.js';
import menuRoutes from './menu.routes.js';
import analyticsRoutes from './analytics.routes.js';

const apiRouter = Router();

apiRouter.use('/orders', orderRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/stores', storeRoutes);
apiRouter.use('/shippers', shipperRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/menu', menuRoutes);
apiRouter.use('/analytics', analyticsRoutes);

apiRouter.get('/health', (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'FastFood Admin API',
    database: databaseReady ? 'connected' : 'disconnected',
  });
});

export default apiRouter;
