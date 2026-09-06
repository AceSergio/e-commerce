const rateLimit = require('express-rate-limit');

// 1. Limiteur global pour toutes les routes API (200 requêtes / 15 min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true, // Retourne RateLimit-* headers
  legacyHeaders: false, // Désactive X-RateLimit-* headers
  message: {
    success: false,
    error: 'Trop de requêtes envoyées. Veuillez réessayer dans quelques minutes.'
  }
});

// 2. Limiteur strict pour l'authentification et l'envoi de codes OTP (10 requêtes / 15 min)
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

// 3. Limiteur strict pour l'initiation de paiements (15 tentatives / 15 min)
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
