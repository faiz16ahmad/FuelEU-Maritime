import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { routesRouter } from './routes/routesRouter';
import { comparisonRouter } from './routes/comparisonRouter';
import { complianceRouter } from './routes/complianceRouter';
import { bankingRouter } from './routes/bankingRouter';
import { poolsRouter } from './routes/poolsRouter';

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/routes', routesRouter);
  app.use('/routes', comparisonRouter); // /routes/comparison
  app.use('/compliance', complianceRouter);
  app.use('/banking', bankingRouter);
  app.use('/pools', poolsRouter);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}