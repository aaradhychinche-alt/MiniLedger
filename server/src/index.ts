import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';

const app = createApp();

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`🚀 MiniLedger Backend Server running on port ${env.PORT}`);
  logger.info(`📡 Base API URL: http://localhost:${env.PORT}/api`);
  logger.info(`📱 Mobile LAN URL: http://<your-lan-ip>:${env.PORT}/api`);
  logger.info(`⏰ Server Timezone: ${env.TZ}`);
  logger.info(`🔒 Environment: ${env.NODE_ENV}`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
