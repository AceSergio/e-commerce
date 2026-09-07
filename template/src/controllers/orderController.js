const { getOrdersAsync, getOrderByOrderIdAsync, getUserOrdersAsync, updateOrderAdminAsync } = require('../data/ordersStore');
const { sendOrderShippedEmail } = require('../services/emailService');
const { isValidAdminToken } = require('../middleware/adminAuth');
const logger = require('../config/logger');

async function getAllOrders(req, res) {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit, 10))) : null;

    if (page) {
      const result = await getOrdersAsync({ page, limit: limit || 50 });
      return res.json({
        success: true,
        count: result.orders.length,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        orders: result.orders
      });
    }

    const orders = await getOrdersAsync();
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des commandes' });
  }
}

async function getUserOrders(req, res) {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const cleanEmail = email.toLowerCase().trim();
    const userOrders = await getUserOrdersAsync(cleanEmail);

    res.json({ success: true, orders: userOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des commandes utilisateur' });
  }
}

async function updateOrder(req, res) {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'ID Commande requis' });
    }

    const updated = await updateOrderAdminAsync(orderId, { status, trackingNumber });
    if (updated) {
      logger.order(`Commande ${orderId} mise à jour : Statut=${status}, Suivi=${trackingNumber || 'aucun'}`, {
        orderId,
        status,
        trackingNumber: trackingNumber || null
      });

      // Si status set à shipped ou tracking number fourni, trigger auto le shipping email
      if (status === 'shipped' || (trackingNumber && trackingNumber.trim().length > 0)) {
        await sendOrderShippedEmail(updated);
      }

      return res.json({ success: true, message: 'Commande mise à jour', order: updated });
    }

    res.status(404).json({ error: 'Commande non trouvée' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de la commande' });
  }
}

async function getOrderById(req, res) {
  try {
    const { orderId } = req.params;
    const email = (req.query.email || req.body?.email || '').toLowerCase().trim();
    if (!orderId) return res.status(400).json({ error: 'ID Commande requis' });

    // Query Prisma directe et indexée
    const order = await getOrderByOrderIdAsync(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    // Protection IDOR / PII leak : Exiger l'email client correspondant ou un token admin valide
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const token = req.headers['x-admin-token'] || bearerToken;
    const isAdmin = isValidAdminToken(token);

    if (!isAdmin) {
      if (!email || (order.customerInfo?.email && order.customerInfo.email.toLowerCase() !== email)) {
        return res.status(404).json({ error: 'Commande introuvable' });
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la recherche de la commande' });
  }
}

module.exports = {
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrder
};
