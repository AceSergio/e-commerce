const crypto = require('crypto');
const stripe = require('../config/stripe');
const config = require('../config/env');
const shopConfig = require('../../config/shop.config');
const { getProductByIdAsync, decrementProductStocksAsync } = require('../data/productsStore');
const {
  getOrderByOrderIdAsync,
  getOrderByPaymentIntentIdAsync,
  saveOrderAsync,
  updateOrderStatusByOrderIdAsync,
  updateOrderStatusByPaymentIntentIdAsync
} = require('../data/ordersStore');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const logger = require('../config/logger');

async function createPaymentIntent(req, res) {
  try {
    const { items, customerInfo, shippingMethod, promoCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Le panier est vide' });
    }

    // Compute le total de l'order côté serveur et check l'inventaire en DB
    let totalCents = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await getProductByIdAsync(item.id);
      if (product) {
        const itemQuantity = Math.max(1, parseInt(item.quantity, 10) || 1);

        // Check si le stock est suffisant
        if (product.stockQuantity < itemQuantity) {
          return res.status(400).json({
            error: product.stockQuantity === 0 
              ? `Le produit "${product.name}" est actuellement en rupture de stock.`
              : `Stock insuffisant pour "${product.name}". Quantité disponible : ${product.stockQuantity}.`
          });
        }

        totalCents += Math.round(product.price * 100) * itemQuantity;
        orderItems.push({
          id: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: itemQuantity
        });
      }
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ error: 'Aucun produit valide dans le panier' });
    }

    // 1. Validation serveur des coupon codes promo (BIZ-02)
    let discountCents = 0;
    let appliedPromoInfo = null;

    if (promoCode && typeof promoCode === 'string') {
      const cleanCode = promoCode.trim().toUpperCase();
      const matchedPromo = (shopConfig.promotions || []).find(p => p.code.toUpperCase() === cleanCode);

      if (matchedPromo) {
        const minCents = matchedPromo.minAmount ? Math.round(matchedPromo.minAmount * 100) : 0;
        if (totalCents >= minCents) {
          discountCents = Math.round(totalCents * matchedPromo.rate);
          appliedPromoInfo = { code: matchedPromo.code, rate: matchedPromo.rate, label: matchedPromo.label };
        }
      } else if (cleanCode === 'BIENVENUE10' || cleanCode === 'LUMEN10') {
        discountCents = Math.round(totalCents * 0.10);
        appliedPromoInfo = { code: cleanCode, rate: 0.10, label: '10% de remise de bienvenue' };
      } else if ((cleanCode === 'LUMEN20' || cleanCode === 'PROMO20') && totalCents >= 12000) {
        discountCents = Math.round(totalCents * 0.20);
        appliedPromoInfo = { code: cleanCode, rate: 0.20, label: '20% dès 120€ d\'achat' };
      }
    }

    // 2. Shipping fees harmonisés avec threshold livraison gratuite (BIZ-03 & BIZ-05)
    const shippingCfg = shopConfig.shipping || {};
    const freeThresholdCents = Math.round((shippingCfg.freeShippingThreshold || 60) * 100);
    const isExpress = shippingMethod === 'chronopost' || shippingMethod === 'express_chronopost';
    
    let shippingFeeCents = 0;
    if (isExpress) {
      shippingFeeCents = Math.round((shippingCfg.expressCost || 9.90) * 100);
    } else {
      const subtotalAfterDiscount = Math.max(0, totalCents - discountCents);
      shippingFeeCents = subtotalAfterDiscount >= freeThresholdCents ? 0 : Math.round((shippingCfg.standardCost || 4.90) * 100);
    }

    const finalAmountCents = Math.max(0, totalCents - discountCents + shippingFeeCents);

    let clientSecret = 'demo_client_secret_simulated';
    let paymentIntentId = 'pi_demo_' + Date.now();
    let checkoutUrl = null;

    // Generate un unique orderId collision-proof (CWE-330 remediation avec CSPRNG)
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const uniqueSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const generatedOrderId = `ORD-${datePrefix}-${uniqueSuffix}`;

    // Si la vraie secret key Stripe est set, on call l'API Stripe officielle (BIZ-01)
    const isRealStripeKey = config.STRIPE_SECRET_KEY && 
      config.STRIPE_SECRET_KEY.startsWith('sk_') && 
      !config.STRIPE_SECRET_KEY.includes('mock') && 
      !config.STRIPE_SECRET_KEY.includes('demo');

    if (isRealStripeKey) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmountCents,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: generatedOrderId,
          customerName: customerInfo?.name || 'Client',
          customerEmail: customerInfo?.email || 'client@example.com',
          itemCount: orderItems.length,
          promoCode: appliedPromoInfo?.code || 'none',
          shippingMethod: isExpress ? 'express' : 'standard'
        }
      });
      clientSecret = paymentIntent.client_secret;
      paymentIntentId = paymentIntent.id;

      // Create la session Stripe Checkout pour un 1-click checkout (Apple Pay, Google Pay, CB 3D-Secure)
      try {
        const origin = req.headers.origin || 'http://localhost:5173';
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: orderItems.map(i => ({
            price_data: {
              currency: 'eur',
              product_data: { name: i.name },
              unit_amount: Math.round(i.unitPrice * 100)
            },
            quantity: i.quantity
          })),
          mode: 'payment',
          success_url: `${origin}/?success=true&order_id=${generatedOrderId}`,
          cancel_url: `${origin}/?canceled=true`,
          customer_email: customerInfo?.email,
          client_reference_id: generatedOrderId,
          metadata: {
            orderId: generatedOrderId,
            paymentIntentId: paymentIntent.id
          }
        });
        checkoutUrl = session.url;
      } catch (errSession) {
        console.warn('Note: Session Stripe Checkout fallback vers PaymentIntent direct:', errSession.message);
      }
    }

    // Save la pending order dans la base SQLite via Prisma
    const pendingOrder = {
      orderId: generatedOrderId,
      paymentIntentId,
      status: 'pending',
      customerInfo: customerInfo || {},
      items: orderItems,
      totalAmount: (finalAmountCents / 100).toFixed(2),
      currency: 'EUR',
      createdAt: new Date().toISOString()
    };

    const saved = await saveOrderAsync(pendingOrder);

    res.json({
      success: true,
      clientSecret,
      checkoutUrl,
      publishableKey: config.STRIPE_PUBLISHABLE_KEY || '',
      orderId: pendingOrder.orderId,
      amount: (finalAmountCents / 100).toFixed(2),
      subtotal: (totalCents / 100).toFixed(2),
      discountAmount: (discountCents / 100).toFixed(2),
      shippingFee: (shippingFeeCents / 100).toFixed(2),
      appliedPromo: appliedPromoInfo,
      isDemoMode: !isRealStripeKey
    });
  } catch (error) {
    console.error('Erreur lors de la création du PaymentIntent:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}

async function confirmDemoPayment(req, res) {
  // CRITICAL SECURITY: Block les simulated payments en environnement de production
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Accès refusé : Le mode de paiement simulé démo est strictement désactivé en environnement de production.'
    });
  }

  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'ID de commande requis' });
  }

  const existingOrder = await getOrderByOrderIdAsync(orderId);
  if (!existingOrder) {
    return res.status(404).json({ error: 'Commande non trouvée' });
  }

  // Idempotency check: bypass le double-processing si l'order est déjà payée
  if (existingOrder.status === 'paid') {
    return res.json({ success: true, message: 'Paiement déjà confirmé', order: existingOrder });
  }

  const updatedOrder = await updateOrderStatusByOrderIdAsync(orderId, 'paid');

  if (updatedOrder) {
    logger.payment(`Commande ${updatedOrder.orderId} confirmée et payée par ${updatedOrder.customerInfo?.email || 'le client'}.`, {
      orderId: updatedOrder.orderId,
      email: updatedOrder.customerInfo?.email,
      total: updatedOrder.totalAmount
    });
    
    // Auto-decrement du stock des products après confirmation du payment
    await decrementProductStocksAsync(updatedOrder.items);

    // Trigger l'envoi de l'email de confirmation de commande
    await sendOrderConfirmationEmail(updatedOrder);

    return res.json({ success: true, message: 'Paiement confirmé avec succès', order: updatedOrder });
  }

  res.status(500).json({ error: 'Impossible de mettre à jour la commande' });
}

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  const endpointSecret = config.STRIPE_WEBHOOK_SECRET;

  if (endpointSecret && sig && config.STRIPE_SECRET_KEY) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error({ category: 'PAYMENT', error: err.message }, 'Erreur signature webhook Stripe');
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Demo webhook fallback (safe parse du raw buffer payload)
    if (Buffer.isBuffer(req.body)) {
      try {
        event = JSON.parse(req.body.toString('utf8'));
      } catch (err) {
        event = {};
      }
    } else {
      event = req.body || {};
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    logger.payment(`Paiement réussi pour Intent: ${paymentIntent.id}`, { paymentIntentId: paymentIntent.id });
    
    const existingOrder = await getOrderByPaymentIntentIdAsync(paymentIntent.id);
    if (!existingOrder) {
      logger.warn({ category: 'PAYMENT', paymentIntentId: paymentIntent.id }, 'Aucune commande trouvée pour PaymentIntent');
      return res.json({ received: true });
    }

    // Idempotency check: drop le webhook replay si l'order est déjà paid
    if (existingOrder.status === 'paid') {
      logger.payment(`Commande ${existingOrder.orderId} déjà validée (idempotence webhook).`, { orderId: existingOrder.orderId });
      return res.json({ received: true });
    }

    const updatedOrder = await updateOrderStatusByPaymentIntentIdAsync(paymentIntent.id, 'paid');
    if (updatedOrder) {
      logger.payment(`Commande ${updatedOrder.orderId} validée automatiquement par Webhook !`, { orderId: updatedOrder.orderId });
      
      // Auto-decrement du stock des items en DB
      await decrementProductStocksAsync(updatedOrder.items);

      await sendOrderConfirmationEmail(updatedOrder);
    }
  }

  res.json({ received: true });
}

module.exports = {
  createPaymentIntent,
  confirmDemoPayment,
  handleWebhook
};
