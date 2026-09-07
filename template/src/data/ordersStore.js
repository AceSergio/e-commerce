const prisma = require('../config/prisma');

// Format les raw order records de Prisma vers l'object JSON de l'API
function formatOrderRecord(order) {
  if (!order) return null;
  return {
    id: order.id,
    orderId: order.orderId,
    paymentIntentId: order.paymentIntentId,
    status: order.status,
    customerInfo: {
      name: order.customerName || 'Client',
      email: order.customerEmail,
      address: order.customerAddress || 'Non spécifiée'
    },
    items: (order.items || []).map(i => ({
      id: i.productId || i.id,
      productId: i.productId || i.id,
      name: i.name,
      unitPrice: i.unitPrice,
      quantity: i.quantity
    })),
    totalAmount: order.totalAmount,
    currency: order.currency,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    paidAt: order.paidAt ? (typeof order.paidAt === 'string' ? order.paidAt : order.paidAt.toISOString()) : null,
    createdAt: order.createdAt ? (typeof order.createdAt === 'string' ? order.createdAt : order.createdAt.toISOString()) : new Date().toISOString()
  };
}

// Fetch les orders avec pagination et skip/take si page & limit sont set
async function getOrdersAsync(options = {}) {
  try {
    const page = options.page ? Math.max(1, parseInt(options.page, 10)) : null;
    const limit = options.limit ? Math.max(1, parseInt(options.limit, 10)) : null;

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [total, rawOrders] = await Promise.all([
        prisma.order.count({ where: { deletedAt: null } }),
        prisma.order.findMany({
          where: { deletedAt: null },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        })
      ]);
      return {
        orders: rawOrders.map(formatOrderRecord),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    }

    const rawOrders = await prisma.order.findMany({
      where: { deletedAt: null },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return rawOrders.map(formatOrderRecord);
  } catch (err) {
    console.error('Erreur Prisma getOrders:', err);
    return options.page ? { orders: [], total: 0, page: 1, totalPages: 1 } : [];
  }
}

// Lookup d'une order par son Stripe paymentIntentId
async function getOrderByPaymentIntentIdAsync(paymentIntentId) {
  if (!paymentIntentId) return null;
  try {
    const rawOrder = await prisma.order.findFirst({
      where: { paymentIntentId },
      include: { items: true }
    });
    return formatOrderRecord(rawOrder);
  } catch (err) {
    console.error('Erreur Prisma getOrderByPaymentIntentId:', err);
    return null;
  }
}

// Lookup d'une order par son unique business orderId
async function getOrderByOrderIdAsync(orderId) {
  if (!orderId) return null;
  try {
    const rawOrder = await prisma.order.findUnique({
      where: { orderId },
      include: { items: true }
    });
    return formatOrderRecord(rawOrder);
  } catch (err) {
    console.error('Erreur Prisma getOrderByOrderId:', err);
    return null;
  }
}

// Fetch toutes les orders passées par un customer via son email
async function getUserOrdersAsync(email) {
  if (!email) return [];
  const cleanEmail = email.toLowerCase().trim();
  try {
    const rawOrders = await prisma.order.findMany({
      where: { customerEmail: cleanEmail, deletedAt: null },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return rawOrders.map(formatOrderRecord);
  } catch (err) {
    console.error('Erreur Prisma getUserOrders:', err);
    return [];
  }
}

// Insert une new order avec ses nested line items en DB
async function saveOrderAsync(orderData) {
  try {
    let userId = null;
    if (orderData.customerInfo?.email) {
      const user = await prisma.user.findUnique({
        where: { email: orderData.customerInfo.email.toLowerCase().trim() }
      });
      if (user) userId = user.id;
    }

    const createdOrder = await prisma.order.create({
      data: {
        orderId: orderData.orderId,
        paymentIntentId: orderData.paymentIntentId || null,
        status: orderData.status || 'pending',
        customerName: orderData.customerInfo?.name || 'Client',
        customerEmail: (orderData.customerInfo?.email || 'client@example.com').toLowerCase().trim(),
        customerAddress: orderData.customerInfo?.address || 'Non spécifiée',
        totalAmount: orderData.totalAmount || '0.00',
        currency: orderData.currency || 'EUR',
        userId,
        items: {
          create: (orderData.items || []).map(item => ({
            productId: item.id || item.productId || null,
            name: item.name || 'Article',
            unitPrice: parseFloat(item.unitPrice || item.price || 0),
            quantity: parseInt(item.quantity || 1, 10)
          }))
        }
      },
      include: { items: true }
    });

    return formatOrderRecord(createdOrder);
  } catch (err) {
    console.error('Erreur Prisma saveOrder:', err);
    return null;
  }
}

// Update le status de l'order par orderId (ex: pending -> paid)
async function updateOrderStatusByOrderIdAsync(orderId, status, paidAt = new Date()) {
  try {
    const updated = await prisma.order.update({
      where: { orderId },
      data: {
        status,
        paidAt: new Date(paidAt)
      },
      include: { items: true }
    });
    return formatOrderRecord(updated);
  } catch (err) {
    console.error('Erreur Prisma updateOrderStatusByOrderId:', err);
    return null;
  }
}

// Update le status de l'order par paymentIntentId (utilisé par le webhook handler)
async function updateOrderStatusByPaymentIntentIdAsync(paymentIntentId, status, paidAt = new Date()) {
  try {
    const order = await prisma.order.findFirst({
      where: { paymentIntentId }
    });
    if (!order) return null;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status,
        paidAt: new Date(paidAt)
      },
      include: { items: true }
    });
    return formatOrderRecord(updated);
  } catch (err) {
    console.error('Erreur Prisma updateOrderStatusByPaymentIntentId:', err);
    return null;
  }
}

// Update admin : change le status ou set le carrier tracking number avec auto-generated La Poste URL
async function updateOrderAdminAsync(orderId, { status, trackingNumber }) {
  try {
    const existingOrder = await prisma.order.findFirst({
      where: { orderId }
    });
    if (!existingOrder) return null;

    const dataToUpdate = {};
    if (status) dataToUpdate.status = status;
    if (trackingNumber !== undefined) {
      dataToUpdate.trackingNumber = trackingNumber.trim();
      dataToUpdate.trackingUrl = trackingNumber.trim()
        ? `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(trackingNumber.trim())}`
        : null;
    }

    const updated = await prisma.order.update({
      where: { id: existingOrder.id },
      data: dataToUpdate,
      include: { items: true }
    });
    return formatOrderRecord(updated);
  } catch (err) {
    console.error('Erreur Prisma updateOrderAdmin:', err);
    return null;
  }
}

module.exports = {
  getOrdersAsync,
  getOrderByOrderIdAsync,
  getOrderByPaymentIntentIdAsync,
  getUserOrdersAsync,
  saveOrderAsync,
  updateOrderStatusByOrderIdAsync,
  updateOrderStatusByPaymentIntentIdAsync,
  updateOrderAdminAsync
};
