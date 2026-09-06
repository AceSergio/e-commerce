#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query, defaultValue) => {
  return new Promise((resolve) => {
    rl.question(`${query} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
};

async function runSetup() {
  console.log('\n=============================================================');
  console.log('🚀  ASSISTANT D\'INITIALISATION DE VOTRE BOUTIQUE E-COMMERCE');
  console.log('=============================================================\n');

  const shopName = await ask('1. Nom de votre Boutique', 'LUMEN');
  const logoEmoji = await ask('2. Emoji / Icône de la marque', '✦');
  const tagline = await ask('3. Slogan de votre marque', 'Objets & Essentiels de Vie Contemporains');
  const primaryColor = await ask('4. Couleur Principale (Hex)', '#c49b66');
  const currencySymbol = await ask('5. Symbole Monétaire', '€');
  const adminPassword = await ask('6. Mot de passe de la Console Admin', 'admin2026');

  console.log('\n⏳ Génération de la configuration personnalisée...');

  const configPath = path.join(__dirname, '../config/shop.config.js');
  const frontendConfigPath = path.join(__dirname, '../frontend/src/config/shop.config.js');

  const configContent = `/**
 * 🌟 Universal E-Commerce Starter Kit - Custom Store Configuration
 * Generated automatically by setup-shop.js
 */

const shopConfig = {
  brand: {
    name: "${shopName}",
    tagline: "${tagline}",
    heroTitle: "L'Excellence ${shopName} à l'État Pur",
    heroSubtitle: "Découvrez notre collection artisanale sélectionnée avec la plus grande exigence.",
    logoEmoji: "${logoEmoji}",
    currency: "EUR",
    currencySymbol: "${currencySymbol}",
    countryOrigin: "France",
    ratingScore: "4.95/5",
    ratingReviewsCount: "850+ avis clients"
  },
  theme: {
    primaryColor: "${primaryColor}",
    primaryGlow: "${primaryColor}cc",
    bgDark: "#080503",
    bgCard: "#140e0a",
    bgCardHover: "#1c140f",
    borderSubtle: "rgba(212, 175, 55, 0.15)",
    borderMedium: "rgba(212, 175, 55, 0.35)",
    textBright: "#ffffff",
    textLight: "#f3f4f6",
    textMuted: "#9ca3af",
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  shipping: {
    freeShippingThreshold: 60.00,
    standardCost: 4.90,
    expressCost: 9.90,
    standardName: "Colissimo Suivi Domicile (48h)",
    expressName: "Chronopost Express 24h Domicile",
    standardDelay: "24h à 48h ouvrées",
    carrierTrackingUrl: "https://www.laposte.fr/outils/suivre-vos-envois?code="
  },
  legal: {
    companyName: "${shopName} SAS",
    capital: "10 000 €",
    rcs: "Paris B 123 456 789",
    siret: "123 456 789 00012",
    tva: "FR 12 123456789",
    address: "12 Rue du Commerce, 75001 Paris, France",
    contactEmail: "contact@${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com",
    supportPhone: "+33 (0)1 23 45 67 89",
    returnPeriodDays: 30
  },
  promotions: [
    { code: "BIENVENUE10", rate: 0.10, label: "10% de bienvenue" }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = shopConfig;
}

export default shopConfig;
`;

  fs.writeFileSync(configPath, configContent, 'utf-8');
  if (fs.existsSync(path.dirname(frontendConfigPath))) {
    fs.writeFileSync(frontendConfigPath, configContent, 'utf-8');
  }

  // Generate .env file
  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    let envData = fs.readFileSync(envExamplePath, 'utf-8');
    envData = envData.replace('ADMIN_PASSWORD=votre_mot_de_passe_admin_securise', `ADMIN_PASSWORD=${adminPassword}`);
    fs.writeFileSync(envPath, envData, 'utf-8');
    console.log('✅ Fichier .env créé avec succès.');
  }

  console.log('⚙️ Initialisation de la base de données SQLite (Prisma)...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    execSync('node prisma/seed.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (err) {
    console.warn('⚠️ Note: Veuillez exécuter "npm run db:push && npm run db:seed" après avoir installé les dépendances.');
  }

  console.log('\n=============================================================');
  console.log(`🎉  FÉLICITATIONS ! VOTRE BOUTIQUE "${shopName}" EST PRÊTE`);
  console.log('=============================================================');
  console.log('  1. Lancer la plateforme : npm run dev');
  console.log('  2. Ouvrir la boutique   : http://localhost:5173');
  console.log('  3. Console Admin        : Accessible dans le footer de la boutique');
  console.log(`  4. Mot de passe Admin   : ${adminPassword}`);
  console.log('=============================================================\n');

  rl.close();
}

runSetup();
