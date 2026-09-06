const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAdminCredentials } = require('../middleware/adminAuth');
const { userAuth } = require('../middleware/userAuth');

const { authLimiter } = require('../middleware/rateLimiter');

// Rate limiting middleware for sensitive auth routes (bypassed in test environment)
const applyAuthLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : authLimiter;

router.post('/auth/send-code', applyAuthLimiter, authController.sendCode);
router.post('/auth/verify-code', applyAuthLimiter, authController.verifyCode);
router.post('/auth/update-profile', userAuth, authController.updateProfile);
router.get('/auth/export-data', userAuth, authController.exportData);
router.post('/auth/export-data', userAuth, authController.exportData);
router.post('/auth/delete-account', userAuth, authController.deleteAccount);
router.delete('/auth/delete-account', userAuth, authController.deleteAccount);

// Admin Authentication Route
router.post('/admin/login', applyAuthLimiter, verifyAdminCredentials);

module.exports = router;


