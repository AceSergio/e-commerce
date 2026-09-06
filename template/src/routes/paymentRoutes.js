const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

const { paymentLimiter } = require('../middleware/rateLimiter');

// Rate limiting middleware for payment intent route (bypassed in test environment)
const applyPaymentLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : paymentLimiter;

router.post('/create-payment-intent', applyPaymentLimiter, paymentController.createPaymentIntent);
router.post('/confirm-demo-payment', paymentController.confirmDemoPayment);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
