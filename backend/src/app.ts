import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

// Enable automatic JSON serialization for BigInt values throughout Express
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { config } from './config';
import { logger } from './logger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { etagMiddleware } from './middleware/etag';
import { prisma } from './prisma';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import bankRoutes from './routes/banks';
import institutionRoutes from './routes/institutions';
import fdrRoutes from './routes/fdrs';
import documentRoutes from './routes/documents';
import releaseRoutes from './routes/releases';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import searchRoutes from './routes/search';
import auditRoutes from './routes/audit';
import settingsRoutes from './routes/settings';
import jobRoutes from './routes/jobs';
import publicRoutes from './routes/public';
import { swaggerSpec } from './swagger/swagger';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // disabled for Swagger UI
}));

// CORS - Allow frontend URL, localhost, and Vercel/Render deployments
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === config.FRONTEND_URL ||
      origin === 'http://localhost:5173' ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    // Allow configured origins or fallback gracefully
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// HTTP logger
app.use(pinoHttp({ logger }));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiRateLimiter);

// ETag caching for GET responses
app.use(etagMiddleware);

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check & Readiness
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'AICTE FDR Vault API is running', timestamp: new Date().toISOString() });
});

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'Database ready' });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database unreachable' });
  }
});

// API routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/banks`, bankRoutes);
app.use(`${API}/institutions`, institutionRoutes);
app.use(`${API}/fdrs`, fdrRoutes);
app.use(`${API}/documents`, documentRoutes);
app.use(`${API}/releases`, releaseRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/search`, searchRoutes);
app.use(`${API}/audit`, auditRoutes);
app.use(`${API}/settings`, settingsRoutes);
app.use(`${API}/jobs`, jobRoutes);
app.use(`${API}/public`, publicRoutes);

// Static uploads (authenticated via download endpoint, not directly served)
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Central error handler
app.use(errorHandler);

export default app;
