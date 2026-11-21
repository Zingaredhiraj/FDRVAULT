import './config'; // validate env first
import app from './app';
import { config } from './config';
import { logger } from './logger';
import { prisma } from './prisma';
import { startStatusJob, runStatusJob } from './jobs/statusJob';
import { startAlertJob } from './jobs/alertJob';
import { execSync } from 'child_process';

const PORT = config.PORT || 4000;

// Auto-bootstrap schema and initial seed if tables or users are absent on cloud deployment
async function ensureDatabaseInitialized() {
  try {
    const userCount = await prisma.user.count().catch(() => -1);
    if (userCount <= 0) {
      logger.info('📦 Initializing cloud database schema and official seed...');
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
        logger.info('✅ Cloud database schema & initial seed ready.');
      } catch (cmdErr) {
        logger.warn({ err: cmdErr }, 'Automatic db push/seed command skipped, continuing server startup');
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Database initialization check warning');
  }
}

const server = app.listen(PORT, async () => {
  logger.info(`🚀 AICTE FDR Vault API running on http://localhost:${PORT}`);
  logger.info(`📖 Swagger docs: http://localhost:${PORT}/api/docs`);
  logger.info(`🌍 Environment: ${config.NODE_ENV}`);

  if (config.NODE_ENV !== 'test') {
    await ensureDatabaseInitialized();
  }
});

// Start scheduled jobs (not in test env)
if (config.NODE_ENV !== 'test') {
  startStatusJob();
  startAlertJob();
  // Run status job on startup to catch any overdue changes
  runStatusJob().catch(err => logger.error(err, 'Initial status job failed'));
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default server;
