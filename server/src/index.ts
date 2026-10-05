import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`[FastFood Server] Running at http://localhost:${ENV.PORT}`);
  });
};

startServer();
