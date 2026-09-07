# ✦ LUMEN — Plateforme E-Commerce Fullstack & Sécurisée

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://lumen-ecommerce.onrender.com)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express 5](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Security Audited](https://img.shields.io/badge/Security-OWASP%20Audited-10B981?style=for-the-badge&logo=shield&logoColor=white)](#-sécurité--fiabilité-de-niveau-production)
[![Tests Passing](https://img.shields.io/badge/Tests-36%2F36%20Passing-success?style=for-the-badge&logo=checkmarx&logoColor=white)](#-qualité--tests-automatisés)

> 🚀 **Démo en Ligne (Live Demo)** : **[https://lumen-ecommerce.onrender.com](https://lumen-ecommerce.onrender.com)**  
> Plateforme e-commerce moderne, performante et haut de gamme développée avec **React 19**, **Express 5**, **Prisma ORM** et **Stripe**.  
> Conçue selon les standards d'ingénierie logicielle et de cybersécurité (**OWASP Top 10**, intégrité transactionnelle, conformité **RGPD** et tunnel d'achat certifié).

---

## 🌐 Démonstration en Direct & Accès Rapide

* 🔗 **Boutique en ligne** : [https://lumen-ecommerce.onrender.com](https://lumen-ecommerce.onrender.com)
* 🛡️ **Console Administration** : Accessible depuis le lien *« 🛡️ Console Administration »* en pied de page (mot de passe démo : `admin2026`).
* ⚡ **Code Promo test** : Utilisez `BIENVENUE10` (-10%) ou `LUMEN20` (-20% dès 120€) dans le panier.
* 🩺 **Sonde Health Check API** : [https://lumen-ecommerce.onrender.com/api/health](https://lumen-ecommerce.onrender.com/api/health)

---

## 📸 Aperçu & Fonctionnalités Clés

* **Boutique & Catalogue** : Interface épurée, responsive et fluide (design sombre haut de gamme, typographie éditoriale, tiroir panier réactif).
* **Tunnel d'Achat en 3 étapes** : Autocomplétion officielle de l'adresse de livraison via l'API Adresse du gouvernement français (API BAN), sélection du transporteur (Colissimo 48h / Chronopost 24h) et passerelle de paiement sécurisée.
* **Espace Client Passwordless** : Authentification sans mot de passe par code OTP temporaire à 6 chiffres par e-mail, historique des commandes en direct et téléchargement de factures conformes.
* **Console d'Administration intégrée** : Pilotage des stocks en direct, expédition des commandes avec génération de liens Colissimo et envoi automatique d'e-mails de notification client.

---

## ✨ Fonctionnalités Clés

### 🛍️ 1. Expérience Client & Tunnel d'Achat
* **Catalogue dynamique & interactif** : Filtrage instantané par univers/catégories, modales descriptives riches, gestion visuelle de la disponibilité des stocks.
* **Panier coulissant en temps réel (*Cart Drawer*)** : Jauge de progression dynamique pour la livraison gratuite (seuil paramétrable, offert dès 60 €).
* **Validation d'adresse BAN (Base Adresse Nationale)** : Intégration de l'API officielle `api-adresse.data.gouv.fr` avec auto-remplissage certifié (rue, code postal, ville).
* **Moteur de codes promotionnels serveur** : Validation stricte des montants minimums et remises côté backend (anti-tampering).
* **Paiement Stripe & Mode Démo** : Intégration Stripe Checkout hébergée (3D-Secure, Apple Pay, Google Pay) avec bascule automatique en mode simulation instantané sans carte réelle pour les tests.

### 🔐 2. Espace Client & Conformité RGPD
* **Authentification sans mot de passe (*Passwordless OTP*)** : Plus de fuite de mots de passe ou d'attaques par dictionnaire. Connexion sécurisée par code aléatoire temporaire (validité 15 min).
* **Historique des commandes & Facturation** : Consultation des statuts d'expédition en direct et modale d'impression de factures officielles au format HTML/PDF conforme.
* **Droit à la portabilité (Art. 20 RGPD)** : Export complet et instantané des données personnelles au format JSON en un clic.
* **Droit à l'effacement (Art. 17 RGPD)** : Suppression de compte avec mécanisme de *Soft Delete* anonymisant les données personnelles tout en préservant l'intégrité comptable des commandes passées.

### 🛡️ 3. Console d'Administration
* **Tableau de bord des ventes** : Chiffre d'affaires total, panier moyen, volume de commandes et état des stocks en temps réel.
* **Gestion en direct du catalogue** : Modification immédiate des prix, stocks disponibles et statuts "Coup de cœur".
* **Gestion logistique des commandes** : Changement d'état (*En attente* ➔ *Payée* ➔ *Expédiée* ➔ *Livrée*), ajout du numéro de colis Colissimo et déclenchement automatique de l'e-mail d'expédition au client.
* **Exports comptables** : Export complet des commandes et du fichier clients au format CSV.

---

## 🔒 Sécurité & Fiabilité de Niveau Production

Ce projet intègre les meilleures pratiques de sécurité logicielle et de résilience (conformité OWASP Top 10) :

| Risque / Norme | Solution Technique Implémentée |
| :--- | :--- |
| **Attaques Temporelles (*Timing Attacks*)** | Comparaison cryptographique en temps constant via `crypto.timingSafeEqual` pour l'authentification administrateur. |
| **Failles IDOR (*Insecure Direct Object References*)** | Consultation publique de commande (`/api/orders/public/:id`) strictement verrouillée par vérification de l'e-mail client associé ou d'un token d'administration. |
| **Prédictibilité des OTP** | Générateur cryptographiquement sûr (*CSPRNG*) via `crypto.randomInt` (remplacement de `Math.random()`). |
| **Identifiants de Commande** | Format non séquentiel et non prédictible : `ORD-YYYYMMDD-HEX6` (ex: `ORD-20260906-A8F31E`). |
| **Race Conditions (Surventes de stock)** | Décrémentation atomique des stocks sous transaction Prisma : `stockQuantity: { decrement: qty }`. |
| **Injection XSS & Clickjacking** | En-têtes HTTP durcis avec `helmet`, désinfection des entrées et isolation CORS stricte. |
| **Protection Brute-Force** | Rate limiters distincts et stricts sur l'authentification OTP et le tunnel de paiement. |
| **Haute Concurrence SQLite** | Base de données optimisée en mode **WAL (*Write-Ahead Logging*)** avec `busy_timeout` pour éviter tout verrou bloquant (*database locked*). |

---

## 🏗️ Architecture & Stack Technique

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend SPA                           │
│     React 19 • Vite 8 • Context API • Lucide Icons          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST
┌──────────────────────────────▼──────────────────────────────┐
│                    API Backend Express 5                    │
│   Rate Limiting • Helmet • Crypto CSPRNG • Pino Logger      │
└──────────────────┬───────────────────────┬──────────────────┘
                   │                       │
      ┌────────────▼──────────┐     ┌──────▼──────────────────┐
      │   Prisma ORM (SQLite) │     │    Services Externes    │
      │  Mode WAL • Soft-Del  │     │ • Stripe Checkout       │
      │  Transactions Stocks  │     │ • API Gouv Adresse BAN  │
      └───────────────────────┘     └─────────────────────────┘
```

* **Frontend** : React 19, Vite 8, Lucide React, Canvas Confetti.
* **Backend** : Node.js, Express 5, Pino Logger, Helmet, Cors, Express Rate Limit.
* **Base de données** : Prisma ORM, SQLite (WAL mode).
* **Intégrations tierces** : Stripe Checkout API, API Adresse Gouv (BAN).

---

## 📁 Structure du Projet

```text
e-commerce/
├── README.md                    # Documentation complète et guide de démarrage
├── render.yaml                  # Configuration de déploiement cloud (Render)
├── .gitignore                   # Exclusion stricte des secrets (.env), bases et builds
└── template/                    # Code source de la plateforme
    ├── config/                  # Configuration centralisée de la boutique
    │   └── shop.config.js       # Textes, marque, frais de port et mentions légales
    ├── frontend/                # Application Client & Admin SPA (React 19 + Vite)
    │   ├── src/
    │   │   ├── components/      # Composants UI (CheckoutPage, CartDrawer, AdminConsole...)
    │   │   ├── context/         # Contextes React (Cart, Auth, Toast, ShopConfig)
    │   │   └── App.jsx          # Composant racine
    ├── prisma/                  # Schéma de base de données relationnelle et migrations
    │   └── schema.prisma        # Modèles User, Order, Product, OtpCode
    ├── src/                     # API Backend (Express 5)
    │   ├── controllers/         # Logique métier (Commandes, Paiements, Auth, Produits)
    │   ├── middleware/          # Sécurité, Authentification admin/user, Rate limiters
    │   ├── routes/              # Routes REST sécurisées
    │   └── services/            # Service d'envoi d'e-mails (SMTP / fallback dev)
    ├── tests/                   # Suite de tests automatisés (Node.js test runner natif)
    │   ├── app.test.js          # Tests d'intégration API, santé, catalogue, checkout, auth et RGPD
    │   └── unit.test.js         # Tests unitaires (sécurité HMAC, logger ring buffer, inventaire, règles métier)
    └── server.js                # Point d'entrée du serveur backend
```

---

## 🚀 Démarrage Rapide

### Prérequis
* **Node.js** v20+ installé
* **npm** ou **yarn**

### 1. Cloner le Dépôt

```bash
git clone git@github.com:AceSergio/e-commerce.git
cd e-commerce/template
```

### 2. Installer les Dépendances

```bash
# Installation du backend
npm install

# Installation du frontend
cd frontend
npm install
cd ..
```

### 3. Initialiser la Base de Données

```bash
# Générer le client Prisma et peupler le catalogue de démonstration
npx prisma db push
npm run seed
```

### 4. Lancer les Serveurs de Développement

```bash
# Lance simultanément le backend (port 3000) et le frontend Vite (port 5173)
npm run dev
```

* 🌐 **Boutique Client** : `http://localhost:5173`
* 🛡️ **Console Administrateur** : `http://localhost:5173` (Lien *"Admin"* en pied de page)
* ⚡ **API Backend** : `http://localhost:3000/api/health`

---

## 🧪 Qualité & Tests Automatisés

Le projet intègre une suite complète de **36 tests automatisés** exécutée via le test runner natif de Node.js, séparée en tests d'intégration API et tests unitaires isolés :

```bash
cd template

# Exécuter l'intégralité de la suite (36 tests)
npm test

# Exécuter uniquement les tests unitaires isolés (29 tests)
npm run test:unit

# Exécuter uniquement les tests d'intégration API (7 tests)
npm run test:integration
```

Résultat des tests :
```text
✔ Suite 1: Sécurité, Authentification & Sessions Cryptographiques (7/7 passés)
✔ Suite 2: Logger Structuré & Ring Buffer Haute Performance (8/8 passés)
✔ Suite 3: Catalogue, Produits & Décrémentation de Stock (5/5 passés)
✔ Suite 4: Gestion des Commandes & Suivi Transporteur (4/4 passés)
✔ Suite 5: Règles Métier, Calculs Financiers & Conformité RGPD (5/5 passés)
✔ E-Commerce Core API Suite d'Intégration (7/7 passés)
ℹ tests 36 | pass 36 | fail 0
```

Vérification de la conformité du code avec **Oxlint** :
```bash
cd template/frontend
npx oxlint src
# ✔ 0 errors, 0 warnings
```

---

## 👨‍💻 Auteur

Développé avec passion par **[AceSergio](https://github.com/AceSergio)**.  
Projet conçu pour illustrer des compétences avancées en développement fullstack, architecture logicielle et sécurité applicative.

