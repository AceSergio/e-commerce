const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

const { paymentLimiter } = require('../middleware/rateLimiter');

// Middleware de rate limiting pour le payment intent (bypassed en test env)
const applyPaymentLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : paymentLimiter;

router.post('/create-payment-intent', applyPaymentLimiter, paymentController.createPaymentIntent);
router.post('/confirm-demo-payment', paymentController.confirmDemoPayment);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
