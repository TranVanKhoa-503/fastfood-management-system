import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Keep cross-origin access limited to the configured local dashboard.
app.use(cors({ origin: ENV.CLIENT_URL }));
app.use(express.json({ limit: '256kb' }));
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ success: false, message: 'Request body must use application/json' });
  }
  next();
});

// API routes
app.use('/api', apiRouter);

// Root greeting
app.get('/', (_req, res) => {
  res.json({
    name: 'FastFood Admin Management API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      '/api/orders',
      '/api/customers',
      '/api/stores',
      '/api/shippers',
      '/api/reviews',
      '/api/menu',
      '/api/analytics',
    ],
  });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  const server = app.listen(ENV.PORT, ENV.HOST, () => {
    console.log(`[FastFood Server] Running at http://${ENV.HOST}:${ENV.PORT}`);
  });
  server.on('error', (error) => {
    console.error('[FastFood Server] Could not start:', error.message);
    process.exit(1);
  });
};

void startServer().catch((error: unknown) => {
  console.error('[FastFood Server] Startup failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});
