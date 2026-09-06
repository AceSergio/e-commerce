const crypto = require('crypto');
const config = require('../config/env');

const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || (isProduction ? null : 'admin_secret_token_2026');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProduction ? null : 'admin2026');

if (isProduction && (!process.env.ADMIN_TOKEN || !process.env.ADMIN_PASSWORD)) {
  console.warn('⚠️ [SECURITE PRODUCTION] ATTENTION: ADMIN_TOKEN ou ADMIN_PASSWORD non définis dans l\'environnement ! Définissez ces variables dans .env pour autoriser l\'administration.');
}

function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = req.headers['x-admin-token'] || bearerToken;
  
  if (!ADMIN_TOKEN || !token) {
    return res.status(401).json({ error: 'Accès non autorisé : Jeton d\'administration invalide ou absent' });
  }

  const tokenBuffer = Buffer.from(String(token));
  const adminTokenBuffer = Buffer.from(String(ADMIN_TOKEN));

  if (tokenBuffer.length !== adminTokenBuffer.length || !crypto.timingSafeEqual(tokenBuffer, adminTokenBuffer)) {
    return res.status(401).json({ error: 'Accès non autorisé : Jeton d\'administration invalide ou absent' });
  }

  next();
}

function verifyAdminCredentials(req, res) {
  const { password } = req.body;

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Le serveur en production nécessite la configuration de ADMIN_PASSWORD dans les variables d\'environnement.' });
  }

  if (password && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      token: ADMIN_TOKEN,
      message: 'Authentification administration réussie'
    });
  }

  return res.status(401).json({ error: 'Mot de passe administrateur incorrect' });
}

function isValidAdminToken(token) {
  if (!ADMIN_TOKEN || !token) return false;
  try {
    const tokenBuffer = Buffer.from(String(token));
    const adminTokenBuffer = Buffer.from(String(ADMIN_TOKEN));
    if (tokenBuffer.length !== adminTokenBuffer.length) return false;
    return crypto.timingSafeEqual(tokenBuffer, adminTokenBuffer);
  } catch (e) {
    return false;
  }
}

module.exports = {
  adminAuth,
  verifyAdminCredentials,
  isValidAdminToken,
  ADMIN_TOKEN
};

