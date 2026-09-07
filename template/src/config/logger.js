/**
 * @fileoverview Système de logging centralisé et structured (Logger Engine)
 * 
 * Architecture du Logger :
 * 1. Engine high-perf : Basé sur Pino pour une serialization JSON ultra-fast.
 * 2. Multi-sinks :
 *    - Console (stdout) : Output colorisé avec timestamps en dev et prod.
 *    - Fichiers locaux (logs/app.log et logs/error.log) : Persistence sur disk avec log rotation automatique (> 5 Mo).
 *    - In-memory ring buffer (300 latest entries) : Permet à l'Admin Console
 *      de pull en realtime l'activité système sans disk I/O overhead.
 * 3. Categorization business : AUTH, ORDER, PAYMENT, STOCK, HTTP, SYSTEM.
 * 4. Test mode : Mute les outputs console pendant les unit/integration tests (NODE_ENV === 'test').
 * 
 * @module config/logger
 */

const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');
const pino = require('pino');

// Setup des environments
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Config des paths pour les log files
const LOG_DIR = path.join(__dirname, '../../logs');
const APP_LOG_PATH = path.join(LOG_DIR, 'app.log');
const ERROR_LOG_PATH = path.join(LOG_DIR, 'error.log');
const MAX_LOG_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo avant rotation

// Auto-create du log directory si missing
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  console.error('[LOGGER INIT ERROR] Impossible de créer le dossier logs:', err.message);
}

// Mapping table des log levels de Pino
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

// In-memory ring buffer pour l'Admin Console (capped à 300 entries max)
const MAX_BUFFER_SIZE = 300;
const inMemoryLogs = [];
let logCounter = 1;

/**
 * Check et trigger la rotation du log file si la file size dépasse MAX_LOG_FILE_SIZE.
 * @param {string} filePath - Absolute path du log file.
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
    // Fail-safe silencieux pour ne pas freeze le thread
  }
}

/**
 * Safe write d'une log line dans le file sur disk.
 * @param {string} filePath - Path du file.
 * @param {string} line - Raw formatted line à append.
 */
function appendToFile(filePath, line) {
  try {
    rotateLogFileIfNeeded(filePath);
    fs.appendFileSync(filePath, line + '\n', 'utf8');
  } catch (err) {
    // Si disk I/O fail, on skip sans crash l'app
  }
}

/**
 * Custom stream qui pipe les chunks JSON Pino et les dispatch :
 * - Vers la stdout avec color formatting
 * - Vers logs/app.log et logs/error.log
 * - Vers le ring buffer en memory pour l'Admin API
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

      // Extraction des custom metadata additionnelles
      const details = { ...obj };
      delete details.level;
      delete details.time;
      delete details.pid;
      delete details.hostname;
      delete details.msg;
      delete details.category;

      const hasDetails = Object.keys(details).length > 0;

      // 1. Store dans le ring buffer en memory
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

      // 2. Append dans les log files sur disk
      const fileLine = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}${
        hasDetails ? ' ' + JSON.stringify(details) : ''
      }`;

      appendToFile(APP_LOG_PATH, fileLine);

      if (levelNum >= 40) {
        appendToFile(ERROR_LOG_PATH, fileLine);
      }

      // 3. Output console (mute en env de test)
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
      // Fallback safe si parsing error
    }
    callback();
  }
});

// Init de l'instance Pino avec notre customStream
const pinoInstance = pino(
  {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')
  },
  customStream
);

/**
 * Fetch les logs récents depuis le Ring Buffer avec filters et pagination.
 * 
 * @param {Object} options - Filtering options.
 * @param {number} [options.limit=100] - Max logs à return (cap à 300 max).
 * @param {string} [options.level] - Filter par log level ('all', 'info', 'warn', 'error', 'debug').
 * @param {string} [options.category] - Filter par business category ('AUTH', 'PAYMENT', 'ORDER', 'STOCK', etc.).
 * @param {string} [options.search] - Fulltext query search dans les messages et metadata details.
 * @returns {Array<Object>} List des logs triés du plus recent au plus old.
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
  // Sort du plus recent au plus old
  return filtered.reverse().slice(0, safeLimit);
}

/**
 * Compute les stats d'activité par log level à partir des buffered entries.
 * @returns {Object} Stats par level et total count.
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
 * Flush et reset le buffer de logs en memory.
 */
function clearLogs() {
  inMemoryLogs.length = 0;
  return true;
}

/**
 * Return le path absolu vers le main app.log file.
 * @returns {string} Absolute path vers app.log.
 */
function getLogFilePath() {
  return APP_LOG_PATH;
}

// Extend de l'instance Pino avec des custom helpers business
pinoInstance.getRecentLogs = getRecentLogs;
pinoInstance.getLogStats = getLogStats;
pinoInstance.clearLogs = clearLogs;
pinoInstance.getLogFilePath = getLogFilePath;

/**
 * Generic helper pour trigger un structured log avec business tag.
 * @param {string} level - 'info' | 'warn' | 'error' | 'debug'.
 * @param {string} category - Business category (AUTH, ORDER, PAYMENT, STOCK, SYSTEM).
 * @param {string} message - Message explicatif du log.
 * @param {Object} [details] - Extra metadata payload facultatif.
 */
pinoInstance.logCategory = function (level, category, message, details = {}) {
  const method = pinoInstance[level] || pinoInstance.info;
  method.call(pinoInstance, { category, ...details }, message);
};

// Shortcuts pratiques par business domain
pinoInstance.system = (msg, details) => pinoInstance.logCategory('info', 'SYSTEM', msg, details);
pinoInstance.auth = (msg, details) => pinoInstance.logCategory('info', 'AUTH', msg, details);
pinoInstance.order = (msg, details) => pinoInstance.logCategory('info', 'ORDER', msg, details);
pinoInstance.payment = (msg, details) => pinoInstance.logCategory('info', 'PAYMENT', msg, details);
pinoInstance.stock = (msg, details) => pinoInstance.logCategory('info', 'STOCK', msg, details);

module.exports = pinoInstance;
