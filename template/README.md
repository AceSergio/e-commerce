# 🚀 Universal E-Commerce Starter Kit

> Squelette complet et prêt à l'emploi pour créer une boutique e-commerce moderne et haut de gamme avec **React 19**, **Express 5**, **Prisma ORM (SQLite)**, **Stripe** et une **Console d'Administration complète**.

---

## ✨ Ce qui est inclus dans le Squelette

* **🛒 Boutique Client SPA (React 19 + Vite 8)** :
  * Catalogue dynamique avec filtres par catégorie et fiches produits détaillées.
  * Panier coulissant en temps réel (*Cart Drawer*) avec calcul de livraison offerte.
  * Tunnel d'achat en 3 étapes avec autocomplétion d'adresse officielle française (API BAN).
  * Paiement Stripe sécurisé & mode simulation démo instantané 1-Clic.
  * Impression et affichage de factures conformes PDF/HTML.
  * Modale de conformité légale (CGV, Mentions Légales, Politique RGPD).
* **🔐 Espace Client & Auth sans mot de passe** :
  * Inscription & Connexion par code OTP sécurisé à 6 chiffres par e-mail.
  * Gestion du profil et historique des commandes avec suivi en direct.
  * Droit à l'oubli et suppression de compte avec protection comptable (*Soft Delete*).
* **🛡️ Console d'Administration intégrée** :
  * Tableau de bord des ventes et indicateurs clés en temps réel.
  * Gestion en direct des stocks, prix et fiches produits.
  * Attribution des numéros de suivi colis et déclenchement automatique des e-mails clients.
  * Export des commandes et des clients en format CSV.
* **⚡ Backend API Express 5 & Base Prisma** :
  * Base de données relationnelle SQLite sans configuration de serveur externe.
  * Logs structurés Pino, sécurité Helmet, Rate Limiting et compression Gzip.

---

## 🚀 Démarrage Rapide (En 3 Étapes)

### 1. Cloner ou copier le dossier `template/`

```bash
cp -r template/ mon-nouveau-projet
cd mon-nouveau-projet
npm install
cd frontend && npm install && cd ..
```

### 2. Lancer l'Assistant de Configuration

```bash
npm run init:shop
```

L'assistant vous posera quelques questions simples (*Nom de la boutique, Emoji logo, Slogan, Couleur principale, Mot de passe admin*) et configurera automatiquement votre boutique !

### 3. Démarrer la Plateforme

```bash
npm run dev
```

* **Boutique Client & Console Admin** : `http://localhost:5173` *(L'administration est accessible via le lien "Admin" en pied de page avec le mot de passe configuré)*
* **API Backend** : `http://localhost:3000`
*(Note : L'ancienne console standalone Vanilla JS a été archivée dans `archives/legacy_admin/`)*

---

## 🎨 Personnalisation Facile (`config/shop.config.js`)

Toute la personnalisation de la boutique (textes, prix, frais de port, informations légales, couleurs) est centralisée dans un fichier unique : [`config/shop.config.js`](file:///home/sergio/Perso/e-commerce/template/config/shop.config.js).

```javascript
module.exports = {
  brand: {
    name: "LUMEN",
    tagline: "Objets & Essentiels de Vie Contemporains",
    logoEmoji: "✦",
    currency: "EUR",
    currencySymbol: "€"
  },
  theme: {
    primaryColor: "#c49b66",
    bgDark: "#0c0d0e"
  },
  shipping: {
    freeShippingThreshold: 60.00,
    standardCost: 4.90
  }
};
```

---

## 📄 Licence

Distribué sous licence **MIT**. Libre d'utilisation pour tous vos projets commerciaux ou personnels.
