import React from 'react';
import { ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useShopConfig } from '../context/ShopConfigContext';

export default function Footer({ onOpenAdmin, onOpenLegal }) {
  const config = useShopConfig();
  const brand = config.brand || {};
  const legal = config.legal || {};
  const shipping = config.shipping || {};

  return (
    <footer
      style={{
        backgroundColor: '#090a0b',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '4.5rem 1.5rem 2rem 1.5rem',
        marginTop: '6rem'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '3rem',
          marginBottom: '3.5rem'
        }}
      >
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.4rem', color: 'var(--gold-primary)' }}>{brand.logoEmoji || '✦'}</span>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: '700',
                letterSpacing: '1px',
                color: 'var(--cream-bright)'
              }}
            >
              {brand.name || 'LUMEN'}
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--cream-muted)', lineHeight: '1.6', marginBottom: '1.2rem' }}>
            {brand.tagline || "Édition d'objets, pièces artisanales et créations durables pensées pour enrichir votre quotidien."}
          </p>

          <div style={{ fontSize: '0.78rem', color: 'var(--cream-dark)', lineHeight: '1.5' }}>
            {legal.companyName || 'Lumen Atelier SAS'} • Capital de {legal.capital || '50 000 €'}<br />
            SIRET : {legal.siret || '912 345 678 00014'} • TVA : {legal.tva || 'FR 32 912345678'}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '1rem', color: 'var(--gold-light)', marginBottom: '1.2rem' }}>
            Navigation
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <li>
              <a href="#catalogue" style={{ color: 'var(--cream-muted)', textDecoration: 'none' }}>
                Catalogue des Pièces
              </a>
            </li>
            <li>
              <a href="#manifeste" style={{ color: 'var(--cream-muted)', textDecoration: 'none' }}>
                Notre Manifeste & Savoir-Faire
              </a>
            </li>
            <li>
              <a href="#engagements" style={{ color: 'var(--cream-muted)', textDecoration: 'none' }}>
                Livraison & Retours {legal.returnPeriodDays ? `(${legal.returnPeriodDays}j)` : '(30j)'}
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={onOpenAdmin}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--gold-primary)',
                  textDecoration: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🛡️ Console Administration
              </button>
            </li>
          </ul>
        </div>

        {/* Guarantees */}
        <div>
          <h4 style={{ fontSize: '1rem', color: 'var(--gold-light)', marginBottom: '1.2rem' }}>
            Nos Garanties
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem', color: 'var(--cream-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={16} color="var(--gold-primary)" />
              <span>{shipping.standardName || 'Livraison Suivie 48h Offerte dès 60€'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--gold-primary)" />
              <span>Paiement 100% Sécurisé SSL & Stripe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--gold-primary)" />
              <span>Garantie Satisfait ou Remboursé {legal.returnPeriodDays || 30} jours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--cream-dark)'
        }}
      >
        <div>
          © {new Date().getFullYear()} {brand.name || 'LUMEN'}. Tous droits réservés.
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('cgv')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--cream-muted)',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              textDecoration: 'underline'
            }}
          >
            Conditions Générales de Vente
          </button>
          <button
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('privacy')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--cream-muted)',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              textDecoration: 'underline'
            }}
          >
            Politique de Confidentialité
          </button>
          <button
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('mentions')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--cream-muted)',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              textDecoration: 'underline'
            }}
          >
            Mentions Légales
          </button>
        </div>
      </div>
    </footer>
  );
}
