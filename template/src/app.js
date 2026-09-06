const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes');

const app = express();

// Trust reverse proxy headers (X-Forwarded-For) for accurate rate limiting
app.set('trust proxy', 1);

// Structured HTTP Request Logger (Pino)
app.use(
  pinoHttp({
    logger,
    autoLogging: process.env.NODE_ENV !== 'test',
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    }
  })
);

// Security headers with Helmet (configured for Stripe, Google Fonts & BAN Address API)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        scriptSrcAttr: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api-adresse.data.gouv.fr", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(compression());

const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

// Webhook raw body parsing prior to global express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve product images from frontend assets
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images'), { maxAge: '1d' }));
app.use('/images', express.static(path.join(__dirname, '../archives/legacy_public/images'), { maxAge: '1d' }));

// Serve static frontend files (React build first, then archives as fallback)
const reactDistPath = path.join(__dirname, '../frontend/dist');
const legacyArchivePath = path.join(__dirname, '../archives/legacy_public');

if (fs.existsSync(reactDistPath)) {
  app.use(express.static(reactDistPath, { maxAge: '1d' }));
} else if (fs.existsSync(legacyArchivePath)) {
  app.use(express.static(legacyArchivePath, { maxAge: '1d' }));
}

const { globalLimiter } = require('./middleware/rateLimiter');

// Apply global rate limiter to API routes (bypassed during automated tests)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', globalLimiter);
}

// API routes
app.use('/api', apiRoutes);

// SPA fallback for React / frontend navigation
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  const reactIndex = path.join(__dirname, '../frontend/dist/index.html');
  const legacyIndex = path.join(__dirname, '../archives/legacy_public/index.html');
  const targetIndex = fs.existsSync(reactIndex) ? reactIndex : legacyIndex;
  
  if (fs.existsSync(targetIndex)) {
    return res.sendFile(targetIndex);
  }
  res.status(404).send('Frontend application index not found. Please run "npm run build:frontend".');
});

module.exports = app;
