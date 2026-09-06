import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import shopConfig from '../config/shop.config';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { showToast } = useToast();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('shop_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Erreur sauvegarde panier local:', e);
    }
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;

    const maxStock = typeof product.stockQuantity === 'number' ? product.stockQuantity : 100;
    if (maxStock <= 0) {
      showToast(`Le produit "${product.name}" est actuellement en rupture de stock.`, 'error', 'Stock Épuisé');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;

      if (currentQty + quantity > maxStock) {
        showToast(`Stock maximal atteint pour "${product.name}" (${maxStock} max).`, 'warning', 'Limite de Stock');
        return prev;
      }

      showToast(`+${quantity} "${product.name}" ajouté au panier`, 'success', 'Panier Mis à Jour');

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            subtitle: product.subtitle,
            price: product.price,
            image: product.image,
            unit: product.unit,
            stockQuantity: maxStock,
            quantity
          }
        ];
      }
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const maxStock = typeof item.stockQuantity === 'number' ? item.stockQuantity : 100;
          if (newQuantity > maxStock) {
            showToast(`Quantité limitée au stock disponible (${maxStock} unités).`, 'warning', 'Stock Limite');
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const shippingCfg = shopConfig.shipping || {};
  const freeShippingThreshold = shippingCfg.freeShippingThreshold || 60;
  const standardCost = shippingCfg.standardCost || 4.90;

  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardCost;
  const total = subtotal + shippingFee;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemCount,
        subtotal,
        shippingFee,
        total,
        getCartTotal: () => subtotal,
        freeShippingRemaining,
        freeShippingProgress,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        lastCompletedOrder,
        setLastCompletedOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
