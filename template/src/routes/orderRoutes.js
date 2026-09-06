const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { adminAuth } = require('../middleware/adminAuth');
const { userAuth } = require('../middleware/userAuth');

router.get('/orders', adminAuth, orderController.getAllOrders);
router.get('/orders/public/:orderId', orderController.getOrderById);
router.get('/user/orders', userAuth, orderController.getUserOrders);
router.put('/orders/:orderId', adminAuth, orderController.updateOrder);

module.exports = router;



