import React, { useState, useEffect } from 'react';
import { ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useShopConfig } from '../context/ShopConfigContext';

export default function Navbar() {
  const { itemCount, total, setIsCartOpen } = useCart();
  const { user, setIsAuthModalOpen } = useAuth();
  const config = useShopConfig();
  const brand = config.brand || {};
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: isScrolled ? 'rgba(12, 13, 14, 0.92)' : 'rgba(12, 13, 14, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isScrolled ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)'}`,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: isScrolled ? '0.75rem 1.5rem' : '1.1rem 1.5rem'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        {/* Brand Logo */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1c1e22 0%, #101214 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: 'var(--gold-primary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            {brand.logoEmoji || '✦'}
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.45rem',
                fontWeight: '700',
                letterSpacing: '1px',
                color: 'var(--cream-bright)',
                display: 'block',
                lineHeight: '1.1'
              }}
            >
              {brand.name || 'LUMEN'}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--gold-primary)',
                letterSpacing: '0.8px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}
            >
              {brand.tagline || "Objets d'Exception"}
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            gap: '2rem',
            alignItems: 'center'
          }}
          className="desktop-nav"
        >
          <a
            href="#catalogue"
            style={{
              color: 'var(--cream-base)',
              textDecoration: 'none',
              fontSize: '0.92rem',
              fontWeight: '500',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => (e.target.style.color = 'var(--gold-primary)')}
            onMouseOut={(e) => (e.target.style.color = 'var(--cream-base)')}
          >
            Collection
          </a>
          <a
            href="#manifeste"
            style={{
              color: 'var(--cream-base)',
              textDecoration: 'none',
              fontSize: '0.92rem',
              fontWeight: '500',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => (e.target.style.color = 'var(--gold-primary)')}
            onMouseOut={(e) => (e.target.style.color = 'var(--cream-base)')}
          >
            Savoir-Faire & Matières
          </a>
          <a
            href="#engagements"
            style={{
              color: 'var(--cream-base)',
              textDecoration: 'none',
              fontSize: '0.92rem',
              fontWeight: '500',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => (e.target.style.color = 'var(--gold-primary)')}
            onMouseOut={(e) => (e.target.style.color = 'var(--cream-base)')}
          >
            Engagements & Livraison
          </a>
        </nav>

        {/* Right Action Icons (User & Cart) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User Profile / Login Button */}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-full)',
              color: user ? 'var(--gold-light)' : 'var(--cream-base)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'var(--transition)'
            }}
            title={user ? `Espace Client : ${user.email}` : 'Se connecter / Espace Client'}
          >
            <User size={17} color="var(--gold-primary)" />
            <span style={{ display: 'inline' }}>
              {user ? (user.name ? user.name.split(' ')[0] : 'Mon Compte') : 'Connexion'}
            </span>
          </button>

          {/* Cart Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--gold-gradient)',
              border: 'none',
              padding: '0.55rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              color: '#0c0d0e',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.9rem',
              boxShadow: 'var(--shadow-gold)',
              transition: 'var(--transition)',
              position: 'relative'
            }}
          >
            <ShoppingBag size={18} />
            <span>{total > 0 ? `${total.toFixed(2)} €` : 'Panier'}</span>
            {itemCount > 0 && (
              <span
                style={{
                  background: '#0c0d0e',
                  color: 'var(--gold-light)',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  border: '1px solid var(--gold-primary)'
                }}
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
