const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { adminAuth } = require('../middleware/adminAuth');

// Route publique pour fetch le catalogue
router.get('/products', productController.getProducts);

// Route admin pour update les infos du product et son stock
router.put('/products/:id', adminAuth, productController.updateProduct);

module.exports = router;
