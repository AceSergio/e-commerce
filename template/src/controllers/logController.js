/**
 * @fileoverview Contrôleur de Gestion des Logs Serveur (LogController)
 * 
 * Ce contrôleur expose les points d'entrée sécurisés réservés à l'administration
 * pour superviser l'activité de la plateforme, diagnostiquer les erreurs
 * et exporter les fichiers de journalisation.
 * 
 * @module controllers/logController
 */

const fs = require('fs');
const logger = require('../config/logger');

/**
 * Récupère les logs récents depuis le Ring Buffer en mémoire.
 * 
 * Permet au tableau de bord administrateur d'afficher les logs en temps réel
 * sans solliciter d'opérations lourdes de lecture sur le disque.
 * 
 * Paramètres de requête (Query params) :
 * - `limit` {number} : Nombre maximum d'entrées (défaut: 100, max: 300)
 * - `level` {string} : Filtrer par niveau ('all', 'info', 'warn', 'error', 'debug')
 * - `category` {string} : Filtrer par catégorie ('all', 'AUTH', 'ORDER', 'PAYMENT', 'STOCK', 'HTTP', 'SYSTEM')
 * - `search` {string} : Filtrage textuel dans les messages et métadonnées
 * 
 * @param {import('express').Request} req - Requête HTTP Express
 * @param {import('express').Response} res - Réponse HTTP Express
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
 * Réinitialise le buffer de logs en mémoire.
 * 
 * Utile pour l'administrateur lors de sessions de débogage ou après
 * avoir résolu un incident pour repartir d'un tableau de bord vierge.
 * 
 * @param {import('express').Request} req - Requête HTTP Express
 * @param {import('express').Response} res - Réponse HTTP Express
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
 * Télécharge le fichier brut de journalisation app.log.
 * 
 * Permet à l'administrateur d'archiver ou d'analyser l'historique complet
 * avec des outils externes (ex: grep, datadog, lnav).
 * 
 * @param {import('express').Request} req - Requête HTTP Express
 * @param {import('express').Response} res - Réponse HTTP Express
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
