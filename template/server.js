const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/config/logger');

const PORT = env.PORT || 3000;

// Start de l'Express HTTP server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Serveur API Boutique démarré sur http://localhost:${PORT}`);
});

// Graceful shutdown handlers pour container platforms (Docker, Render) et signals OS
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, fermeture du serveur...');
  server.close(() => {
    logger.info('Serveur fermé.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, fermeture du serveur...');
  server.close(() => {
    process.exit(0);
  });
});
