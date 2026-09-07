/**
 * @fileoverview Controller pour le log management serveur (LogController)
 * 
 * Ce controller expose les admin endpoints protégés
 * pour monitorer le runtime de la plateforme, debugger les crashes
 * et dump les log files.
 * 
 * @module controllers/logController
 */

const fs = require('fs');
const logger = require('../config/logger');

/**
 * Fetch les logs récents depuis le Ring Buffer en memory.
 * 
 * Permet au dashboard admin de stream les logs en realtime
 * sans trigger des heavy reads sur le disk.
 * 
 * Query params supportés :
 * - `limit` {number} : Max entries à fetch (default: 100, max: 300)
 * - `level` {string} : Filter par level ('all', 'info', 'warn', 'error', 'debug')
 * - `category` {string} : Filter par domain tag ('all', 'AUTH', 'ORDER', 'PAYMENT', 'STOCK', 'HTTP', 'SYSTEM')
 * - `search` {string} : Fulltext search filter dans les messages et metadata
 * 
 * @param {import('express').Request} req - Express HTTP Request
 * @param {import('express').Response} res - Express HTTP Response
 */
async function getLogs(req, res) {
  try {
    const { limit = 100, level, category, search } = req.query;

    const logs = logger.getRecentLogs({
      limit: parseInt(limit, 10) || 100,
      level,
      category,
      search
    });

    const stats = logger.getLogStats();

    return res.json({
      success: true,
      count: logs.length,
      stats,
      logs
    });
  } catch (error) {
    logger.error({ category: 'SYSTEM', error: error.message }, 'Erreur lors de la récupération des logs');
    return res.status(500).json({ success: false, error: 'Erreur interne lors de la lecture des logs' });
  }
}

/**
 * Flush et reset le buffer de logs en memory.
 * 
 * Très pratique pour l'admin pendant des debug sessions ou après
 * un hotfix pour clean la vue du terminal.
 * 
 * @param {import('express').Request} req - Express HTTP Request
 * @param {import('express').Response} res - Express HTTP Response
 */
async function clearLogs(req, res) {
  try {
    logger.clearLogs();
    logger.info({ category: 'SYSTEM' }, 'Buffer des logs réinitialisé par l\'administrateur');

    return res.json({
      success: true,
      message: 'Logs réinitialisés avec succès'
    });
  } catch (error) {
    logger.error({ category: 'SYSTEM', error: error.message }, 'Erreur lors de la réinitialisation des logs');
    return res.status(500).json({ success: false, error: 'Erreur interne lors de la réinitialisation des logs' });
  }
}

/**
 * Download le raw log file app.log.
 * 
 * Permet à l'admin d'exporter l'historique complet pour parsing
 * dans des tools externes (ex: grep, datadog, lnav).
 * 
 * @param {import('express').Request} req - Express HTTP Request
 * @param {import('express').Response} res - Express HTTP Response
 */
async function downloadLogFile(req, res) {
  try {
    const filePath = logger.getLogFilePath();

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Fichier de log introuvable' });
    }

    const filename = `lumen-server-${new Date().toISOString().slice(0, 10)}.log`;
    return res.download(filePath, filename);
  } catch (error) {
    logger.error({ category: 'SYSTEM', error: error.message }, 'Erreur lors du téléchargement du fichier de logs');
    return res.status(500).json({ success: false, error: 'Erreur lors du téléchargement' });
  }
}

module.exports = {
  getLogs,
  clearLogs,
  downloadLogFile
};
