/**
 * @fileoverview Routing pour le log system (LogRoutes)
 * 
 * Tous les endpoints ici sont locked pour l'admin
 * via le middleware timing-safe `adminAuth`.
 * 
 * @module routes/logRoutes
 */

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { adminAuth } = require('../middleware/adminAuth');

/**
 * Route GET /admin/logs
 * Fetch les logs récents avec query filtering et realtime stats.
 */
router.get('/admin/logs', adminAuth, logController.getLogs);

/**
 * Route DELETE /admin/logs
 * Flush et reset le buffer de logs en memory.
 */
router.delete('/admin/logs', adminAuth, logController.clearLogs);

/**
 * Route GET /admin/logs/download
 * Download le log file app.log complet pour export et archive.
 */
router.get('/admin/logs/download', adminAuth, logController.downloadLogFile);

module.exports = router;
