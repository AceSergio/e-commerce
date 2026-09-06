const express = require('express');
const router = express.Router();

const productRoutes = require('./productRoutes');
const paymentRoutes = require('./paymentRoutes');
const orderRoutes = require('./orderRoutes');
const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');

router.use('/', productRoutes);
router.use('/', paymentRoutes);
router.use('/', orderRoutes);
router.use('/', authRoutes);
router.use('/', healthRoutes);

module.exports = router;
