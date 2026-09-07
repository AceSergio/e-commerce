const rateLimit = require('express-rate-limit');

// 1. Rate limiter global pour toutes les routes de l'API (200 requests / 15 min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true, // Return les headers standard RateLimit-*
  legacyHeaders: false, // Disable les legacy headers X-RateLimit-*
  message: {
    success: false,
    error: 'Trop de requêtes envoyées. Veuillez réessayer dans quelques minutes.'
  }
});

// 2. Rate limiter strict pour l'auth et l'envoi d'OTP codes (10 requests / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de demandes de code d\'accès. Par sécurité, veuillez patienter 15 minutes.'
  }
});

// 3. Rate limiter strict pour checkout / payment initiation (15 requests / 15 min)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Nombre maximal d\'initiations de paiement atteint. Veuillez repasser dans 15 minutes.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  paymentLimiter
};
