const crypto = require('crypto');
const { 
  createSession, 
  invalidateSession, 
  findUserByEmailAsync, 
  saveUserAsync, 
  deleteUserAsync,
  saveAuthCodeAsync,
  getAuthCodeAsync,
  deleteAuthCodeAsync
} = require('../data/usersStore');
const { getUserOrdersAsync } = require('../data/ordersStore');
const { sendAuthCodeEmail } = require('../services/emailService');
const logger = require('../config/logger');

async function sendCode(req, res) {
  try {
    const { email, isRegister, name, address } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresse e-mail valide requise' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await findUserByEmailAsync(cleanEmail);

    if (isRegister) {
      if (existingUser) {
        return res.status(400).json({ error: 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.' });
      }
    } else {
      if (!existingUser) {
        return res.status(400).json({ error: 'Aucun compte associé à cette adresse e-mail. Veuillez créer un compte.' });
      }
    }

    // Génération d'un OTP 6-digits cryptographiquement secure (remédiation CWE-330)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // Valid 15 mins

    // Persist le code dans SQLite via Prisma (avec in-memory caching)
    await saveAuthCodeAsync(cleanEmail, otpCode, expiresAt, isRegister, { name, address });

    logger.auth(`Code d'accès (${isRegister ? 'Inscription' : 'Connexion'}) généré pour ${cleanEmail}`, {
      email: cleanEmail,
      isRegister: !!isRegister
    });

    // Send un vrai email via SMTP si configured (ou dev fallback log)
    await sendAuthCodeEmail(cleanEmail, otpCode, isRegister);

    const isProduction = process.env.NODE_ENV === 'production';
    const responseObj = {
      success: true,
      message: `Code d'accès envoyé à ${cleanEmail}`
    };

    // JAMAIS leak le devCode en production
    if (!isProduction) {
      responseObj.devCode = otpCode;
    }

    res.json(responseObj);
  } catch (error) {
    logger.error({ category: 'AUTH', error: error.message }, 'Erreur lors de l\'envoi du code d\'accès');
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code d\'accès' });
  }
}

async function verifyCode(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || typeof email !== 'string' || !code) {
      return res.status(400).json({ error: 'E-mail et code requis' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = String(code).trim();
    const storedAuth = await getAuthCodeAsync(cleanEmail);

    if (!storedAuth) {
      return res.status(400).json({ error: 'Aucun code demandé pour cet e-mail' });
    }

    if (Date.now() > storedAuth.expiresAt) {
      await deleteAuthCodeAsync(cleanEmail);
      return res.status(400).json({ error: 'Le code à 6 chiffres a expiré. Veuillez en demander un nouveau.' });
    }

    if (storedAuth.code !== cleanCode) {
      return res.status(400).json({ error: 'Code incorrect. Veuillez vérifier les 6 chiffres.' });
    }

    let user = await findUserByEmailAsync(cleanEmail);

    if (storedAuth.isRegister) {
      if (user) {
        await deleteAuthCodeAsync(cleanEmail);
        return res.status(400).json({ error: 'Ce compte existe déjà. Veuillez vous connecter.' });
      }
      user = await saveUserAsync({
        email: cleanEmail,
        name: storedAuth.name || cleanEmail.split('@')[0],
        address: storedAuth.address || ''
      });
    } else {
      if (!user) {
        await deleteAuthCodeAsync(cleanEmail);
        return res.status(400).json({ error: 'Utilisateur non trouvé. Veuillez créer un compte.' });
      }
    }

    // Code vérifié ! Delete de la DB et issue un session token secure
    await deleteAuthCodeAsync(cleanEmail);
    const sessionToken = createSession(cleanEmail);

    // Fetch les orders du user
    const userOrders = await getUserOrdersAsync(cleanEmail);

    res.json({
      success: true,
      token: sessionToken,
      user: {
        ...user,
        token: sessionToken
      },
      orders: userOrders
    });
  } catch (error) {
    console.error('Erreur verifyCode:', error);
    res.status(500).json({ error: 'Erreur lors de la validation du code' });
  }
}

async function updateProfile(req, res) {
  try {
    const { email, name, address } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const cleanEmail = email.toLowerCase().trim();
    let user = await findUserByEmailAsync(cleanEmail);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const updatedUser = await saveUserAsync({
      email: cleanEmail,
      name: name !== undefined ? name : user.name,
      address: address !== undefined ? address : user.address
    });

    res.json({ success: true, message: 'Profil mis à jour avec succès', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
}

async function deleteAccount(req, res) {
  try {
    const { email } = req.body;
    const token = req.headers['x-user-token'] || req.body?.token;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const cleanEmail = email.toLowerCase().trim();
    const result = await deleteUserAsync(cleanEmail);

    if (!result.success) {
      if (result.hasActiveOrders) {
        return res.status(400).json({ error: result.error, hasActiveOrders: true });
      }
      return res.status(404).json({ error: result.error || 'Utilisateur non trouvé' });
    }

    if (token) invalidateSession(token);

    logger.auth(`Compte supprimé (Soft Delete RGPD) pour ${cleanEmail}`, { email: cleanEmail });
    res.json({ success: true, message: 'Compte supprimé avec succès (données archivées en conformité)' });
  } catch (error) {
    logger.error({ category: 'AUTH', error: error.message }, 'Erreur lors de la suppression du compte');
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
}

async function exportData(req, res) {
  try {
    const email = (req.body?.email || req.query?.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const user = await findUserByEmailAsync(email);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const orders = await getUserOrdersAsync(email);

    const exportPayload = {
      exportDate: new Date().toISOString(),
      gdprCompliance: 'RGPD Article 20 - Droit à la portabilité des données',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      orders: orders.map((o) => ({
        orderId: o.orderId,
        status: o.status,
        totalAmount: o.totalAmount,
        currency: o.currency,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        shippingAddress: o.customerInfo?.address,
        trackingNumber: o.trackingNumber,
        items: o.items
      }))
    };

    res.setHeader('Content-Disposition', `attachment; filename="export-donnees-${email.split('@')[0]}.json"`);
    res.json({
      success: true,
      data: exportPayload
    });
  } catch (error) {
    console.error('Erreur exportData:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données' });
  }
}

module.exports = {
  sendCode,
  verifyCode,
  updateProfile,
  deleteAccount,
  exportData
};
