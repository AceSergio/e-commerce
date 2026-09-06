const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { adminAuth } = require('../middleware/adminAuth');

// Public route to get catalogue
router.get('/products', productController.getProducts);

// Admin route to update product information & stock
router.put('/products/:id', adminAuth, productController.updateProduct);

module.exports = router;
