/**
 * @fileoverview Définition des Routes de Journalisation Système (LogRoutes)
 * 
 * Toutes les routes définies ici sont strictement restreintes à l'administrateur
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
 * Récupère les logs récents avec statistiques et filtres.
 */
router.get('/admin/logs', adminAuth, logController.getLogs);

/**
 * Route DELETE /admin/logs
 * Réinitialise le buffer de logs en mémoire.
 */
router.delete('/admin/logs', adminAuth, logController.clearLogs);

/**
 * Route GET /admin/logs/download
 * Télécharge le fichier app.log complet pour archivage.
 */
router.get('/admin/logs/download', adminAuth, logController.downloadLogFile);

module.exports = router;
