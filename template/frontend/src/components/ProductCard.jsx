import React from 'react';
import { Eye, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onOpenDetails }) {
  const { addToCart } = useCart();

  const stock = typeof product.stockQuantity === 'number'
    ? product.stockQuantity
    : (typeof product.stock === 'number' ? product.stock : 100);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;
  const displayPrice = (typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0).toFixed(2);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '22px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'rgba(196, 155, 102, 0.45)';
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 18px 35px rgba(0,0,0,0.65), 0 0 20px rgba(196,155,102,0.08)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Product Image Container */}
      <div
        style={{
          position: 'relative',
          height: '250px',
          overflow: 'hidden',
          cursor: 'pointer',
          background: 'var(--bg-dark)'
        }}
        onClick={() => onOpenDetails(product)}
      >
        <img
          src={product.image || '/images/hero.jpg'}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/images/hero.jpg';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
        />

        {/* Badge */}
        {(product.badge || product.popular) && (
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              background: 'linear-gradient(135deg, #d4ae7c 0%, #a8814e 100%)',
              color: '#0c0d0e',
              fontSize: '0.74rem',
              fontWeight: '800',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ✦ {product.badge || 'Sélection'}
          </div>
        )}

        {/* Stock Badge on Top Right */}
        <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
          {isOutOfStock ? (
            <span className="stock-pill stock-out">⚠️ Rupture</span>
          ) : isLowStock ? (
            <span className="stock-pill stock-low">⚠️ Plus que {stock}</span>
          ) : (
            <span className="stock-pill stock-in">🟢 En Stock</span>
          )}
        </div>
      </div>

      {/* Product Body */}
      <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          onClick={() => onOpenDetails(product)}
          style={{
            fontSize: '1.18rem',
            lineHeight: '1.3',
            color: 'var(--cream-bright)',
            marginBottom: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {product.name}
        </h3>

        {product.subtitle && (
          <div style={{ fontSize: '0.82rem', lineHeight: '1.4', color: 'var(--gold-primary)', fontWeight: '600', marginBottom: '8px' }}>
            {product.subtitle}
          </div>
        )}

        <p
          style={{
            fontSize: '0.86rem',
            color: 'var(--cream-muted)',
            lineHeight: '1.55',
            marginBottom: '1rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {product.description}
        </p>

        {/* Characteristics Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.4rem' }}>
          {product.spec1Value && (
            <span
              style={{
                fontSize: '0.74rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                padding: '3px 8px',
                borderRadius: '6px',
                color: 'var(--cream-muted)'
              }}
            >
              {product.spec1Label ? `${product.spec1Label}: ` : ''}{product.spec1Value}
            </span>
          )}
          {product.spec2Value && (
            <span
              style={{
                fontSize: '0.74rem',
                background: 'rgba(196, 155, 102, 0.08)',
                border: '1px solid rgba(196, 155, 102, 0.22)',
                padding: '3px 8px',
                borderRadius: '6px',
                color: 'var(--gold-light)'
              }}
            >
              {product.spec2Label ? `${product.spec2Label}: ` : ''}{product.spec2Value}
            </span>
          )}
          {product.origin && !product.spec1Value && !product.spec2Value && (
            <span
              style={{
                fontSize: '0.74rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                padding: '3px 8px',
                borderRadius: '6px',
                color: 'var(--cream-muted)'
              }}
            >
              Origine: {product.origin}
            </span>
          )}
        </div>

        {/* Footer with Price & Actions */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--gold-light)', lineHeight: '1.1' }}>
              {displayPrice} €
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--cream-dark)', marginTop: '2px' }}>
              {product.unit ? `/ ${product.unit}` : 'TTC'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onOpenDetails(product)}
              className="btn-ghost"
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.5rem 0.8rem',
                fontSize: '0.8rem',
                color: 'var(--cream-base)'
              }}
              title="Voir la fiche détaillée"
            >
              <Eye size={16} />
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => addToCart(product, 1)}
              className="btn-primary"
              style={{
                padding: '0.55rem 1.15rem',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {isOutOfStock ? 'Épuisé' : (
                <>
                  <Plus size={16} />
                  <span>Ajouter</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
