const Stripe = require('stripe');
const config = require('./env');

const stripe = new Stripe(config.STRIPE_SECRET_KEY);

module.exports = stripe;
