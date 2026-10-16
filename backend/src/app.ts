import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import customerRoutes from './routes/customer.routes';
import leadRoutes from './routes/lead.routes';
import followUpRoutes from './routes/followUp.routes';
import visitRoutes from './routes/visit.routes';
import itemRoutes from './routes/item.routes';
import quotationRoutes from './routes/quotation.routes';
import orderRoutes from './routes/order.routes';
import targetRoutes from './routes/target.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import settingRoutes from './routes/setting.routes';
import locationRoutes from './routes/location.routes';
import auditLogRoutes from './routes/auditLog.routes';

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    const allowed = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
    if (process.env.NODE_ENV !== 'production' || allowed.includes(origin) || allowed.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for demo & easy company handover
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use(limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, error: 'Too many attempts. Try again later.' } });

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('short'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'MV GREENTECH CRM API is running', timestamp: new Date().toISOString() });
});

// Routes (Mounted at both /api/v1 and /v1 for complete client compatibility)
const registerRoutes = (prefix: string) => {
  app.use(`${prefix}/auth`, authLimiter, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/customers`, customerRoutes);
  app.use(`${prefix}/leads`, leadRoutes);
  app.use(`${prefix}/follow-ups`, followUpRoutes);
  app.use(`${prefix}/visits`, visitRoutes);
  app.use(`${prefix}/items`, itemRoutes);
  app.use(`${prefix}/quotations`, quotationRoutes);
  app.use(`${prefix}/orders`, orderRoutes);
  app.use(`${prefix}/targets`, targetRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/settings`, settingRoutes);
  app.use(`${prefix}/locations`, locationRoutes);
  app.use(`${prefix}/audit-logs`, auditLogRoutes);
};

registerRoutes('/api/v1');
registerRoutes('/v1');

// Error handler
app.use(errorHandler);

export default app;
