# 📋 Mémoire du Projet — Starter Kit E-Commerce Universel (LUMEN)

> **Document de référence et état du projet** sauvegardé le 26 Août 2026.  
> Conçu pour reprendre le développement immédiatement lors des prochaines sessions sans perte d'information.

---

## 🎯 1. État Actuel & Réalisations Majeures

### 🔹 Identité & Thème
* **Nom de marque par défaut** : **`LUMEN`** *(Atelier d'objets, luminaires, céramiques et essentiels de vie contemporains)*.
* **Charte graphique** : Design System luxe neutre & minéral (Noir profond `#0c0d0e`, surfaces feutrées `#141619`, accents champagne/bronze `#c49b66`, typographies *Cormorant Garamond* et *Outfit*).
* **Zéro résidu VanillaSell** : Toutes les références ont été purgées (code, tokens, local storage, e-mails, exports CSV, factures et mentions légales).
* **Images haute résolution générées par IA** :
  * `hero.jpg` : Intérieur architectural contemporain & lumière naturelle
  * `vase.jpg` : Vase Sculptural Minéral (Grès brut)
  * `candle.jpg` : Bougie Botanique Ébène & Ambre
  * `throw.jpg` : Plaid en Lin Pur Lavé
  * `lamp.jpg` : Lampe de Table Laiton & Travertin
  * `carafe.jpg` : Service Carafe & Verres Fumés
  * `diffuser.jpg` : Diffuseur Olfactif en Pierre Volcanique

---

## ⚙️ 2. Architecture Technique

| Composant | Technologie | Port / Rôle |
| :--- | :--- | :--- |
| **Boutique Client** | React 19 + Vite 8 SPA | `http://localhost:5173` |
| **Console Admin** | Vanilla JS + Express + Chart.js | `http://localhost:3001` |
| **API Backend** | Node.js Express 5 + Pino Logger | `http://localhost:3000` |
| **Base de Données** | SQLite via Prisma ORM 6.x | `prisma/dev.db` |
| **Paiement** | Stripe API + Mode Simulation Démo 1-Clic | Intégré |

---

## 🔑 3. Identifiants & Configuration

* **Mot de passe Admin par défaut** : `admin2026`
* **Jeton API Admin** : `admin_secret_token_2026` *(configuré dans `.env`)*
* **Codes Promo Actifs** :
  * `BIENVENUE10` : -10% immédiat sur toute la commande
  * `LUMEN20` : -20% dès 120 € d'achat
* **Clés LocalStorage unifiées** : `shop_cart`, `shop_user`, `admin_auth_token`
* **Fichiers de configuration centrale** :
  * [`template/config/shop.config.js`](file:///home/sergio/Perso/e-commerce/template/config/shop.config.js) *(Backend)*
  * [`template/frontend/src/config/shop.config.js`](file:///home/sergio/Perso/e-commerce/template/frontend/src/config/shop.config.js) *(Frontend)*

---

## 🚀 4. Commandes de Démarrage

```bash
# Démarrage complet en 1 commande (Frontend + Admin + API Backend) :
cd /home/sergio/Perso/e-commerce/template
npm run dev

# Réinitialiser / Ré-alimenter la base SQLite :
npx prisma db push
node prisma/seed.js

# Compiler le frontend React en production :
npm run build:frontend

# Assistant interactif pour changer de boutique en 1 minute :
npm run init:shop
```

---

## 🛠️ 5. Derniers Correctifs Appliqués

* **Modale Légale (`LegalModal.jsx`)** : Résolution du bug d'affichage intempestif au démarrage via l'ajout de la condition `if (!isOpen) return null;` et synchronisation `useEffect` des onglets (`cgv`, `privacy`, `mentions`).
* **Synchronisation Catalogue API** : `productsStore.js` mis à jour pour mapper dynamiquement les caractéristiques universelles (`spec1Label`, `spec1Value`, `spec2Label`, `spec2Value`, `badge`, `origin`).

---

## 🗺️ 6. Pistes pour les Prochaines Sessions (Roadmap)

1. **Stripe Production** : Configuration des clés `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` réelles dans `.env` si activation des vrais encaissements bancaires.
2. **Gestionnaire d'Upload d'Images** : Ajout d'un endpoint d'upload direct d'images depuis la console d'administration pour charger de nouveaux produits sans toucher au code.
3. **Module d'Avis Clients** : Ajout d'une table Prisma pour collecter et afficher des notes/avis clients vérifiés sous chaque fiche produit.
4. **Export Comptable Avancé** : Génération de factures PDF côté serveur via Puppeteer ou PDFKit.
