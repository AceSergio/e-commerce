const prisma = require('../config/prisma');

async function getHealthStatus(req, res) {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;

  try {
    const dbStart = Date.now();
    // Execute quick lightweight probe query
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (err) {
    console.error('[HEALTH CHECK] Erreur connexion base de données:', err.message);
    dbStatus = 'error';
  }

  const isHealthy = dbStatus === 'connected';

  const healthPayload = {
    status: isHealthy ? 'ok' : 'degraded',
    service: 'E-Commerce Platform API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs
    },
    system: {
      memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024))
    }
  };

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(healthPayload);
}

module.exports = {
  getHealthStatus
};
