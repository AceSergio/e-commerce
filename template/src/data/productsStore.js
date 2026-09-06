const prisma = require('../config/prisma');
const DEFAULT_PRODUCTS = require('./products');

/**
 * Format database product to API JSON response
 */
function formatProduct(p) {
  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    description: p.description,
    price: p.price,
    unit: p.unit,
    categoryId: p.categoryId,
    category: p.categoryId,
    image: p.image,
    badge: p.badge,
    origin: p.origin,
    spec1Label: p.spec1Label,
    spec1Value: p.spec1Value,
    spec2Label: p.spec2Label,
    spec2Value: p.spec2Value,
    popular: p.isPopular,
    isPopular: p.isPopular,
    stockQuantity: p.stockQuantity
  };
}

/**
 * Fetch products from Prisma SQLite database with fallback to static catalog.
 */
async function getProductsAsync() {
  try {
    const dbProducts = await prisma.product.findMany({
      orderBy: { price: 'asc' }
    });

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map(formatProduct);
    }
  } catch (err) {
    console.error('Erreur Prisma getProductsAsync (fallback sur catalogue statique):', err.message);
  }

  return DEFAULT_PRODUCTS;
}

/**
 * Find single product by ID.
 */
async function getProductByIdAsync(productId) {
  if (!productId) return null;
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (product) {
      return formatProduct(product);
    }
  } catch (err) {
    console.error('Erreur Prisma getProductByIdAsync:', err.message);
  }

  return DEFAULT_PRODUCTS.find(p => p.id === productId) || null;
}

/**
 * Update product information and stock in Prisma SQLite DB.
 */
async function updateProductAsync(productId, data) {
  if (!productId) return null;
  try {
    const updatePayload = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.subtitle !== undefined) updatePayload.subtitle = data.subtitle.trim();
    if (data.description !== undefined) updatePayload.description = data.description.trim();
    if (data.price !== undefined) updatePayload.price = Math.max(0, parseFloat(data.price));
    if (data.unit !== undefined) updatePayload.unit = data.unit.trim();
    if (data.badge !== undefined) updatePayload.badge = data.badge.trim();
    if (data.origin !== undefined) updatePayload.origin = data.origin.trim();
    if (data.spec1Label !== undefined) updatePayload.spec1Label = data.spec1Label.trim();
    if (data.spec1Value !== undefined) updatePayload.spec1Value = data.spec1Value.trim();
    if (data.spec2Label !== undefined) updatePayload.spec2Label = data.spec2Label.trim();
    if (data.spec2Value !== undefined) updatePayload.spec2Value = data.spec2Value.trim();
    if (data.isPopular !== undefined) updatePayload.isPopular = !!data.isPopular;
    if (data.popular !== undefined) updatePayload.isPopular = !!data.popular;
    if (data.stockQuantity !== undefined) updatePayload.stockQuantity = Math.max(0, parseInt(data.stockQuantity, 10) || 0);
    if (data.stock !== undefined) updatePayload.stockQuantity = Math.max(0, parseInt(data.stock, 10) || 0);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updatePayload
    });

    return formatProduct(updated);
  } catch (err) {
    console.error('Erreur Prisma updateProductAsync:', err.message);
    return null;
  }
}

/**
 * Atomically decrement stock quantities for an array of ordered items.
 */
async function decrementProductStocksAsync(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return true;

  try {
    for (const item of items) {
      const prodId = item.id || item.productId;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (!prodId) continue;

      // Décrémentation atomique native SQL / Prisma (élimine les race conditions)
      const updated = await prisma.product.update({
        where: { id: prodId },
        data: {
          stockQuantity: {
            decrement: qty
          }
        }
      });
      console.log(`[STOCK ATOMIQUE] 📉 Stock décrémenté pour "${updated.name}" : nouveau stock = ${updated.stockQuantity} (-${qty})`);
    }
    return true;
  } catch (err) {
    console.error('Erreur Prisma decrementProductStocksAsync:', err.message);
    return false;
  }
}

module.exports = {
  getProductsAsync,
  getProductByIdAsync,
  updateProductAsync,
  decrementProductStocksAsync
};
