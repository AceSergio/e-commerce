import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const stock = typeof product.stockQuantity === 'number'
    ? product.stockQuantity
    : (typeof product.stock === 'number' ? product.stock : 100);
  const isOutOfStock = stock <= 0;
  const unitPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;

  const handleIncrement = () => {
    if (quantity < stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 6, 8, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(165deg, #181b1f 0%, #101215 100%)',
          border: '1px solid var(--border-medium)',
          borderRadius: '24px',
          maxWidth: '860px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9)',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: 'var(--cream-base)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'var(--transition)'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Image Section */}
        <div style={{ position: 'relative', minHeight: '340px', background: 'var(--bg-dark)' }}>
          <img
            src={product.image || '/images/hero.jpg'}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = '/images/hero.jpg';
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '24px 0 0 24px'
            }}
          />
          {(product.badge || product.popular) && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'linear-gradient(135deg, #d4ae7c 0%, #a8814e 100%)',
                color: '#0c0d0e',
                fontSize: '0.8rem',
                fontWeight: '800',
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              ✦ {product.badge || 'Sélection'}
            </div>
          )}
        </div>

        {/* Modal Details Content */}
        <div style={{ padding: '2.2rem 2.2rem 2.2rem 0.5rem', display: 'flex', flexDirection: 'column' }}>
          {product.subtitle && (
            <div style={{ fontSize: '0.82rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.4' }}>
              {product.subtitle}
            </div>
          )}

          <h2 style={{ fontSize: '1.75rem', lineHeight: '1.25', color: 'var(--cream-bright)', marginTop: '6px', marginBottom: '0.8rem', fontWeight: '600' }}>
            {product.name}
          </h2>

          <p style={{ color: 'var(--cream-muted)', fontSize: '0.94rem', lineHeight: '1.65', marginBottom: '1.5rem' }}>
            {product.description}
          </p>

          {/* Technical Specs Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cream-dark)' }}>
                {product.spec1Label || 'Matière / Format'}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--gold-light)', marginTop: '2px' }}>
                ✦ {product.spec1Value || product.unit || 'Format Standard'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cream-dark)' }}>
                {product.spec2Label || 'Origine / Conception'}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--gold-light)', marginTop: '2px' }}>
                ✨ {product.spec2Value || product.origin || 'Atelier de Création'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cream-dark)' }}>Conditionnement</div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--cream-base)', marginTop: '2px' }}>
                📦 {product.unit || 'Emballage protecteur'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cream-dark)' }}>Disponibilité</div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', marginTop: '2px' }}>
                {isOutOfStock ? (
                  <span style={{ color: '#ef4444' }}>⚠️ Épuisé</span>
                ) : (
                  <span style={{ color: '#10b981' }}>🟢 {stock} en stock</span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Stepper */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              paddingTop: '1.2rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--gold-light)' }}>
                {(unitPrice * quantity).toFixed(2)} €
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cream-dark)', marginTop: '2px' }}>
                {unitPrice.toFixed(2)} € {product.unit ? `/ ${product.unit}` : 'l\'unité'}
              </div>
            </div>

            {/* Stepper */}
            {!isOutOfStock && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px'
                }}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--cream-base)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= stock}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--cream-base)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className="btn-primary"
              style={{ padding: '0.8rem 1.4rem' }}
            >
              <ShoppingBag size={18} />
              {isOutOfStock ? 'Rupture' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
