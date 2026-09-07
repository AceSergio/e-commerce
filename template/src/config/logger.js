/**
 * @fileoverview Système de Journalisation Centralisé et Structuré (Logger)
 * 
 * Architecture du Logger :
 * 1. Moteur Haute Performance : Basé sur Pino pour une sérialisation ultra-rapide en JSON.
 * 2. Multi-Destinations :
 *    - Console (stdout) : Sortie colorisée avec timestamps en développement et production.
 *    - Fichiers locaux (logs/app.log et logs/error.log) : Persistance sur disque avec rotation automatique (> 5 Mo).
 *    - Ring Buffer en mémoire (300 dernières entrées) : Permet à la Console d'Administration
 *      d'interroger en temps réel l'activité système sans surcharge d'I/O disque.
 * 3. Catégorisation Métier : AUTH, ORDER, PAYMENT, STOCK, HTTP, SYSTEM.
 * 4. Mode Test : Silencieux lors des tests automatisés (NODE_ENV === 'test').
 * 
 * @module config/logger
 */

const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');
const pino = require('pino');

// Définition des environnements
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Configuration des répertoires de logs
const LOG_DIR = path.join(__dirname, '../../logs');
const APP_LOG_PATH = path.join(LOG_DIR, 'app.log');
const ERROR_LOG_PATH = path.join(LOG_DIR, 'error.log');
const MAX_LOG_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo avant rotation

// Création du répertoire de logs si inexistant
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  console.error('[LOGGER INIT ERROR] Impossible de créer le dossier logs:', err.message);
}

// Table de correspondance des niveaux Pino
const LEVEL_NAMES = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal'
};

const COLOR_CODES = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

// Ring Buffer en mémoire pour la console admin (limité aux 300 dernières entrées)
const MAX_BUFFER_SIZE = 300;
const inMemoryLogs = [];
let logCounter = 1;

/**
 * Vérifie et effectue la rotation d'un fichier de log si sa taille dépasse MAX_LOG_FILE_SIZE.
 * @param {string} filePath - Chemin absolu du fichier de log.
 */
function rotateLogFileIfNeeded(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size >= MAX_LOG_FILE_SIZE) {
        const backupPath = `${filePath}.1`;
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
        }
        fs.renameSync(filePath, backupPath);
      }
    }
  } catch (e) {
    // Échec silencieux pour ne pas bloquer le flux d'application
  }
}

/**
 * Écrit de façon sécurisée une ligne dans un fichier de log.
 * @param {string} filePath - Chemin du fichier.
 * @param {string} line - Ligne formatée à écrire.
 */
function appendToFile(filePath, line) {
  try {
    rotateLogFileIfNeeded(filePath);
    fs.appendFileSync(filePath, line + '\n', 'utf8');
  } catch (err) {
    // En cas d'erreur I/O disque, on n'arrête pas l'application
  }
}

/**
 * Stream personnalisé recevant les chunks JSON de Pino et les distribuant :
 * - Vers la console avec formatage coloré
 * - Vers logs/app.log et logs/error.log
 * - Vers le ring buffer mémoire pour l'API Admin
 */
const customStream = new Writable({
  write(chunk, encoding, callback) {
    try {
      const raw = chunk.toString();
      const obj = JSON.parse(raw);

      const levelNum = obj.level || 30;
      const level = LEVEL_NAMES[levelNum] || 'info';
      const timestamp = new Date(obj.time || Date.now()).toISOString();
      const message = obj.msg || '';
      const category = (obj.category || (obj.req ? 'HTTP' : 'APP')).toUpperCase();

      // Extraction des métadonnées additionnelles
      const details = { ...obj };
      delete details.level;
      delete details.time;
      delete details.pid;
      delete details.hostname;
      delete details.msg;
      delete details.category;

      const hasDetails = Object.keys(details).length > 0;

      // 1. Stockage en Ring Buffer mémoire
      const logEntry = {
        id: `log-${Date.now()}-${logCounter++}`,
        timestamp,
        level,
        category,
        message,
        details: hasDetails ? details : null
      };

      inMemoryLogs.push(logEntry);
      if (inMemoryLogs.length > MAX_BUFFER_SIZE) {
        inMemoryLogs.shift();
      }

      // 2. Écriture dans les fichiers de logs
      const fileLine = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}${
        hasDetails ? ' ' + JSON.stringify(details) : ''
      }`;

      appendToFile(APP_LOG_PATH, fileLine);

      if (levelNum >= 40) {
        appendToFile(ERROR_LOG_PATH, fileLine);
      }

      // 3. Affichage Console (sauf en environnement de test)
      if (!isTest) {
        let color = COLOR_CODES.green;
        if (level === 'warn') color = COLOR_CODES.yellow;
        if (level === 'error' || level === 'fatal') color = COLOR_CODES.red;
        if (level === 'debug' || level === 'trace') color = COLOR_CODES.cyan;

        const timeStr = timestamp.substring(11, 19);
        const consoleLine = `${COLOR_CODES.dim}${timeStr}${COLOR_CODES.reset} ${color}${COLOR_CODES.bold}[${level.toUpperCase()}]${COLOR_CODES.reset} ${COLOR_CODES.magenta}[${category}]${COLOR_CODES.reset} ${message}`;

        if (levelNum >= 50) {
          process.stderr.write(consoleLine + '\n');
        } else {
          process.stdout.write(consoleLine + '\n');
        }
      }
    } catch (e) {
      // Fallback en cas d'erreur de parsing
    }
    callback();
  }
});

// Création de l'instance Pino avec le customStream
const pinoInstance = pino(
  {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')
  },
  customStream
);

/**
 * Récupère les logs récents depuis le Ring Buffer avec filtrage et pagination.
 * 
 * @param {Object} options - Options de filtrage.
 * @param {number} [options.limit=100] - Nombre maximum d'entrées à retourner (max 300).
 * @param {string} [options.level] - Filtrer par niveau ('all', 'info', 'warn', 'error', 'debug').
 * @param {string} [options.category] - Filtrer par catégorie ('AUTH', 'PAYMENT', 'ORDER', 'STOCK', etc.).
 * @param {string} [options.search] - Recherche textuelle dans les messages et détails.
 * @returns {Array<Object>} Liste des logs ordonnés du plus récent au plus ancien.
 */
function getRecentLogs({ limit = 100, level, category, search } = {}) {
  let filtered = [...inMemoryLogs];

  if (level && level !== 'all') {
    const cleanLevel = level.toLowerCase();
    filtered = filtered.filter((l) => l.level === cleanLevel);
  }

  if (category && category !== 'all') {
    const cleanCat = category.toUpperCase();
    filtered = filtered.filter((l) => l.category === cleanCat);
  }

  if (search && search.trim().length > 0) {
    const query = search.trim().toLowerCase();
    filtered = filtered.filter((l) => {
      const msgMatch = l.message.toLowerCase().includes(query);
      const catMatch = l.category.toLowerCase().includes(query);
      const detailsMatch = l.details ? JSON.stringify(l.details).toLowerCase().includes(query) : false;
      return msgMatch || catMatch || detailsMatch;
    });
  }

  const safeLimit = Math.min(300, Math.max(1, parseInt(limit, 10) || 100));
  // Ordonner du plus récent au plus ancien
  return filtered.reverse().slice(0, safeLimit);
}

/**
 * Calcule les statistiques d'activité à partir des logs enregistrés.
 * @returns {Object} Statistiques par niveau et volume total.
 */
function getLogStats() {
  const stats = {
    total: inMemoryLogs.length,
    info: 0,
    warn: 0,
    error: 0,
    debug: 0
  };

  inMemoryLogs.forEach((l) => {
    if (stats[l.level] !== undefined) {
      stats[l.level]++;
    }
  });

  return stats;
}

/**
 * Réinitialise le buffer de logs en mémoire.
 */
function clearLogs() {
  inMemoryLogs.length = 0;
  return true;
}

/**
 * Retourne le chemin du fichier de logs principal.
 * @returns {string} Chemin absolu vers app.log.
 */
function getLogFilePath() {
  return APP_LOG_PATH;
}

// Extension de l'objet Pino avec des helpers métier pratiques
pinoInstance.getRecentLogs = getRecentLogs;
pinoInstance.getLogStats = getLogStats;
pinoInstance.clearLogs = clearLogs;
pinoInstance.getLogFilePath = getLogFilePath;

/**
 * Helper générique pour émettre un log structuré avec catégorie.
 * @param {string} level - 'info' | 'warn' | 'error' | 'debug'.
 * @param {string} category - Catégorie métier (AUTH, ORDER, PAYMENT, STOCK, SYSTEM).
 * @param {string} message - Message explicatif.
 * @param {Object} [details] - Données additionnelles facultatives.
 */
pinoInstance.logCategory = function (level, category, message, details = {}) {
  const method = pinoInstance[level] || pinoInstance.info;
  method.call(pinoInstance, { category, ...details }, message);
};

// Raccourcis pratiques par domaine métier
pinoInstance.system = (msg, details) => pinoInstance.logCategory('info', 'SYSTEM', msg, details);
pinoInstance.auth = (msg, details) => pinoInstance.logCategory('info', 'AUTH', msg, details);
pinoInstance.order = (msg, details) => pinoInstance.logCategory('info', 'ORDER', msg, details);
pinoInstance.payment = (msg, details) => pinoInstance.logCategory('info', 'PAYMENT', msg, details);
pinoInstance.stock = (msg, details) => pinoInstance.logCategory('info', 'STOCK', msg, details);

module.exports = pinoInstance;
