const { validateSession } = require('../data/usersStore');

function userAuth(req, res, next) {
  const token = req.headers['x-user-token'] || req.body?.token || req.query?.token;
  const email = req.body?.email || req.query?.email;

  if (!token || !email || !validateSession(token, email)) {
    return res.status(401).json({
      error: 'Accès non autorisé : Jeton d\'authentification utilisateur invalide, manquant ou expiré.'
    });
  }

  next();
}

module.exports = { userAuth };
