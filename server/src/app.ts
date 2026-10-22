import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

export const createApp = () => {
  const app = express();

  // CORS configuration allowing mobile apps and dev tools
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for uploaded receipt images
  const uploadsPath = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Global rate limiter
  app.use('/api', apiLimiter);

  // API Routes
  app.use('/api', apiRouter);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'MiniLedger API',
      version: '1.0.0',
      description: 'Production-minded financial tracker API for friend loans & repayments',
      docs: '/api/health',
    });
  });

  // 404 handler for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Central error handling middleware
  app.use(errorHandler);

  return app;
};
