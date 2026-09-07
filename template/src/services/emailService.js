const nodemailer = require('nodemailer');
const config = require('../config/env');
const shopConfig = require('../../config/shop.config');
const logger = require('../config/logger');

function getTransporter() {
  if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
    return nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });
  }
  return null;
}

const BRAND_NAME = shopConfig.brand?.name || 'Boutique';
const BRAND_TAGLINE = shopConfig.brand?.tagline || 'Objets & Créations Contemporaines';
const PRIMARY_COLOR = shopConfig.theme?.primaryColor || '#c49b66';
const LOGO_EMOJI = shopConfig.brand?.logoEmoji || '✦';

async function sendAuthCodeEmail(email, code, isRegister) {
  if (!email || !code) return false;

  const subject = isRegister 
    ? `${LOGO_EMOJI} Code de création de compte ${BRAND_NAME} : ${code}`
    : `${LOGO_EMOJI} Code de connexion ${BRAND_NAME} : ${code}`;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c0d0e; color: #f1f5f9; padding: 30px; border-radius: 12px; max-width: 550px; margin: 0 auto; border: 1px solid ${PRIMARY_COLOR};">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: ${PRIMARY_COLOR}; margin: 0; font-size: 26px; letter-spacing: 1px;">${LOGO_EMOJI} ${BRAND_NAME}</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">${BRAND_TAGLINE}</p>
      </div>

      <div style="background-color: #141619; padding: 25px; border-radius: 10px; border-left: 4px solid ${PRIMARY_COLOR}; margin-bottom: 20px;">
        <p style="font-size: 16px; margin: 0 0 15px 0;">Bonjour,</p>
        <p style="font-size: 15px; line-height: 1.5; color: #e5e7eb; margin: 0 0 20px 0;">
          ${isRegister ? 'Voici votre code à 6 chiffres pour finaliser la création de votre compte client :' : 'Voici votre code à 6 chiffres pour accéder à votre Espace Client :'}
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff; background: linear-gradient(135deg, ${PRIMARY_COLOR}, #f1f5f9); -webkit-background-clip: text; padding: 12px 24px; border: 2px dashed ${PRIMARY_COLOR}; border-radius: 8px; display: inline-block;">
            ${code}
          </span>
        </div>

        <p style="font-size: 13px; color: #f87171; font-weight: 500; text-align: center; margin-top: 15px;">
          ⏱️ Ce code est à usage unique et expire dans <strong>15 minutes</strong>.
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
        Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail en toute sécurité.<br>
        © ${new Date().getFullYear()} ${BRAND_NAME} — Tous droits réservés.
      </p>
    </div>
  `;

  const textContent = `Bonjour,\n\n${isRegister ? 'Votre code de création de compte' : 'Votre code de connexion'} ${BRAND_NAME} est : ${code}\n\nCe code est valide pendant 15 minutes.\n\nL'équipe ${BRAND_NAME}`;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: config.EMAIL_FROM,
        to: email,
        subject,
        text: textContent,
        html: htmlContent
      });
      logger.auth(`E-mail OTP envoyé via SMTP à ${email}`, { messageId: info.messageId });
      return true;
    } catch (err) {
      logger.error({ category: 'AUTH', error: err.message }, `Erreur d'envoi SMTP à ${email}`);
    }
  }

  logger.auth(`Simulation e-mail OTP générée pour ${email}`, { email });
  console.log(`\n=================================================================`);
  console.log(`✉️ [EMAIL REAL SERVICE / FALLBACK LOG] CODE OTP D'ACCÈS`);
  console.log(`-----------------------------------------------------------------`);
  console.log(`À : ${email}`);
  console.log(`Sujet : ${subject}`);
  console.log(`Code : ${code} (Valide 15 minutes)`);
  console.log(`Statut SMTP : ⚠️ Non configuré dans .env (Renseignez SMTP_HOST, SMTP_USER, SMTP_PASS)`);
  console.log(`=================================================================\n`);

  return false;
}

async function sendOrderConfirmationEmail(order) {
  if (!order || !order.customerInfo?.email) return false;

  const email = order.customerInfo.email;
  const name = order.customerInfo.name || 'Client';
  const orderId = order.orderId;
  const totalAmount = order.totalAmount;
  const address = order.customerInfo.address || 'Non spécifiée';

  const itemsList = (order.items || [])
    .map(i => `• ${i.name} (x${i.quantity}) - ${(i.unitPrice * i.quantity).toFixed(2)} €`)
    .join('\n');

  const subject = `Confirmation de votre commande ${BRAND_NAME} N° ${orderId}`;
  const textContent = `Bonjour ${name},\n\nMerci pour votre commande ${orderId} !\nVotre paiement de ${totalAmount} € a été validé.\n\nArticles:\n${itemsList}\n\nLivraison:\n${address}\n\nCordialement,\nL'équipe ${BRAND_NAME}`;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.EMAIL_FROM,
        to: email,
        subject,
        text: textContent
      });
      logger.order(`Confirmation de commande ${orderId} envoyée via SMTP à ${email}`, { orderId, email });
      return true;
    } catch (err) {
      logger.error({ category: 'ORDER', error: err.message }, `Erreur d'envoi confirmation commande à ${email}`);
    }
  }

  console.log(`\n=================================================================`);
  console.log(`✉️ [EMAIL AUTOMATION SERVER] ENVOI D'E-MAIL DE CONFIRMATION`);
  console.log(`-----------------------------------------------------------------`);
  console.log(`À : ${name} <${email}>`);
  console.log(`Sujet : ${subject}`);
  console.log(`Total : ${totalAmount} € | Adresse : ${address}`);
  console.log(`=================================================================\n`);

  return true;
}

async function sendOrderShippedEmail(order) {
  if (!order || !order.customerInfo?.email) return false;

  const email = order.customerInfo.email;
  const name = order.customerInfo.name || 'Client';
  const orderId = order.orderId;
  const trackingNumber = order.trackingNumber || 'En cours d\'attribution';
  const trackingUrl = order.trackingUrl || `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(trackingNumber)}`;
  const address = order.customerInfo.address || 'Adresse renseignée';

  const subject = `📦 Votre commande ${BRAND_NAME} N° ${orderId} a été expédiée !`;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c0d0e; color: #f1f5f9; padding: 30px; border-radius: 12px; max-width: 550px; margin: 0 auto; border: 1px solid ${PRIMARY_COLOR};">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: ${PRIMARY_COLOR}; margin: 0; font-size: 26px; letter-spacing: 1px;">${LOGO_EMOJI} ${BRAND_NAME}</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">${BRAND_TAGLINE}</p>
      </div>

      <div style="background-color: #141619; padding: 25px; border-radius: 10px; border-left: 4px solid #10b981; margin-bottom: 20px;">
        <h2 style="font-size: 18px; color: #10b981; margin: 0 0 10px 0;">📦 Votre colis est en route !</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #e5e7eb; margin: 0 0 15px 0;">
          Bonjour <strong>${name}</strong>,<br>
          Nous avons le plaisir de vous informer que votre commande <strong>${orderId}</strong> vient d'être préparée et expédiée avec le plus grand soin.
        </p>

        <div style="background: #0c0d0e; border: 1px solid #27272a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 13px; color: #94a3b8;">N° de Suivi de livraison :</div>
          <div style="font-size: 18px; font-weight: bold; color: ${PRIMARY_COLOR}; letter-spacing: 1px; margin-top: 4px;">
            ${trackingNumber}
          </div>
          <div style="font-size: 13px; color: #94a3b8; margin-top: 10px;">Adresse de livraison :</div>
          <div style="font-size: 14px; color: #f1f5f9; margin-top: 2px;">📍 ${address}</div>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${trackingUrl}" target="_blank" style="background: ${PRIMARY_COLOR}; color: #0c0d0e; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; display: inline-block;">
            🔍 Suivre mon colis
          </a>
        </div>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
        Besoin d'aide ? Répondez simplement à cet e-mail.<br>
        © ${new Date().getFullYear()} ${BRAND_NAME} — Tous droits réservés.
      </p>
    </div>
  `;

  const textContent = `Bonjour ${name},\n\nVotre commande ${BRAND_NAME} N° ${orderId} a été expédiée !\nN° de Suivi : ${trackingNumber}\nLien de suivi : ${trackingUrl}\n\nAdresse de livraison :\n${address}\n\nMerci de votre confiance,\nL'équipe ${BRAND_NAME}`;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.EMAIL_FROM,
        to: email,
        subject,
        text: textContent,
        html: htmlContent
      });
      logger.order(`Notification d'expédition ${orderId} envoyée via SMTP à ${email}`, { orderId, email, trackingNumber });
      return true;
    } catch (err) {
      logger.error({ category: 'ORDER', error: err.message }, `Erreur d'envoi notification expédition à ${email}`);
    }
  }

  logger.order(`Simulation e-mail d'expédition générée pour commande ${orderId}`, { orderId, email, trackingNumber });

  console.log(`\n=================================================================`);
  console.log(`✉️ [EMAIL AUTOMATION SERVER] NOTIFICATION EXPEDITION`);
  console.log(`-----------------------------------------------------------------`);
  console.log(`À : ${name} <${email}>`);
  console.log(`Sujet : ${subject}`);
  console.log(`Suivi : ${trackingNumber} -> ${trackingUrl}`);
  console.log(`=================================================================\n`);

  return true;
}

module.exports = {
  sendAuthCodeEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail
};
