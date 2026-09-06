import React from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    updateQuantity,
    removeFromCart,
    itemCount,
    subtotal,
    shippingFee,
    total,
    freeShippingRemaining,
    freeShippingProgress
  } = useCart();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 3, 2, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 600,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={() => setIsCartOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: '#130d09',
          borderLeft: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.9)',
          animation: 'slideDrawerIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.4rem 1.6rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={22} color="var(--gold-primary)" />
            <h2 style={{ fontSize: '1.35rem', color: 'var(--cream-bright)', margin: 0 }}>
              Votre Panier ({itemCount})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: 'var(--cream-base)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div
          style={{
            padding: '1rem 1.6rem',
            backgroundColor: 'rgba(212, 175, 55, 0.06)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem' }}>
            <Truck size={16} color="var(--gold-primary)" />
            {freeShippingRemaining > 0 ? (
              <span>
                Plus que <strong style={{ color: 'var(--gold-light)' }}>{freeShippingRemaining.toFixed(2)} €</strong> pour la livraison Colissimo <strong>Offerte</strong> !
              </span>
            ) : (
              <span style={{ color: '#34d399', fontWeight: '700' }}>
                🎉 Félicitations ! La livraison Colissimo est offerte.
              </span>
            )}
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${freeShippingProgress}%`,
                height: '100%',
                background: 'var(--gold-gradient)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.6rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--cream-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--gold-primary)' }}>✦</div>
              <p style={{ fontSize: '1.05rem', color: 'var(--cream-base)', marginBottom: '0.5rem', fontWeight: '600' }}>
                Votre panier est vide
              </p>
              <p style={{ fontSize: '0.86rem', color: 'var(--cream-dark)', marginBottom: '1.5rem' }}>
                Découvrez notre sélection de pièces durables et d'objets intemporels.
              </p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="btn-secondary"
                style={{ padding: '0.65rem 1.4rem' }}
              >
                Explorer la Collection
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    backgroundColor: 'rgba(28, 19, 13, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '12px'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid rgba(212,175,55,0.2)'
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--cream-bright)', margin: 0 }}>
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--cream-dark)',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', margin: '2px 0 6px 0' }}>
                      {item.price.toFixed(2)} € / {item.unit || 'pièce'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      {/* Quantity Controls */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: '#0d0805',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-full)',
                          padding: '2px 6px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--cream-base)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', minWidth: '22px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--cream-base)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--gold-light)' }}>
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer / Checkout CTA */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '1.4rem 1.6rem',
              backgroundColor: 'rgba(15, 10, 7, 0.95)',
              borderTop: '1px solid var(--border-medium)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--cream-muted)' }}>
              <span>Sous-total articles :</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--cream-muted)' }}>
              <span>Livraison Colissimo :</span>
              <span>{shippingFee === 0 ? <strong style={{ color: '#34d399' }}>GRATUITE</strong> : `${shippingFee.toFixed(2)} €`}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                paddingTop: '10px',
                marginBottom: '1.2rem',
                fontSize: '1.25rem',
                fontWeight: '800',
                color: 'var(--cream-bright)'
              }}
            >
              <span>TOTAL TTC :</span>
              <span style={{ color: 'var(--gold-light)' }}>{total.toFixed(2)} €</span>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            >
              <span>Passer la Commande</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
