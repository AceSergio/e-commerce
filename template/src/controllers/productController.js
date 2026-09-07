const { getProductsAsync, getProductByIdAsync, updateProductAsync } = require('../data/productsStore');
const logger = require('../config/logger');

async function getProducts(req, res) {
  try {
    const products = await getProductsAsync();
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json({ success: true, products });
  } catch (error) {
    logger.error({ category: 'SYSTEM', error: error.message }, 'Erreur lors de la récupération des produits');
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des produits' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'ID du produit requis' });
    }

    const existing = await getProductByIdAsync(id);
    if (!existing) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const updated = await updateProductAsync(id, req.body);
    if (!updated) {
      return res.status(500).json({ error: 'Échec de la mise à jour du produit' });
    }

    logger.stock(`Produit "${updated.name}" (${id}) mis à jour : Stock=${updated.stockQuantity}, Prix=${updated.price}€`, {
      productId: id,
      name: updated.name,
      stockQuantity: updated.stockQuantity,
      price: updated.price
    });
    res.json({
      success: true,
      message: `Produit "${updated.name}" mis à jour avec succès`,
      product: updated
    });
  } catch (error) {
    logger.error({ category: 'STOCK', error: error.message }, 'Erreur updateProduct');
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit' });
  }
}

module.exports = {
  getProducts,
  updateProduct
};
