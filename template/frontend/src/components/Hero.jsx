import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useShopConfig } from '../context/ShopConfigContext';

export default function Hero() {
  const config = useShopConfig();
  const brand = config.brand || {};
  const shipping = config.shipping || {};

  return (
    <section
      style={{
        position: 'relative',
        padding: '4.5rem 1.5rem 4rem 1.5rem',
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '3.5rem',
        alignItems: 'center'
      }}
    >
      {/* Left Content */}
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(196, 155, 102, 0.1)',
            border: '1px solid rgba(196, 155, 102, 0.25)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: '600',
            color: 'var(--gold-light)',
            marginBottom: '1.5rem'
          }}
        >
          <Sparkles size={15} color="var(--gold-primary)" />
          Édition {new Date().getFullYear()} • Pièces Artisanales & Essentiels Durables
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)',
            lineHeight: '1.2',
            color: 'var(--cream-bright)',
            marginBottom: '1.5rem',
            fontWeight: '600',
            letterSpacing: '-0.02em'
          }}
        >
          {brand.heroTitle || "L'Élégance du Design Durable & Intemporel"}
        </h1>

        <p
          style={{
            fontSize: '1.08rem',
            color: 'var(--cream-muted)',
            lineHeight: '1.7',
            marginBottom: '2.2rem',
            maxWidth: '540px'
          }}
        >
          {brand.heroSubtitle || "Découvrez une collection soignée d'objets du quotidien, pièces artisanales et créations minimalistes conçues pour durer."}
        </p>

        {/* Call to Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <a
            href="#catalogue"
            className="btn-primary"
            style={{ padding: '0.85rem 1.8rem', fontSize: '1rem' }}
          >
            Explorer la Collection
            <ArrowRight size={18} />
          </a>
          <a
            href="#manifeste"
            className="btn-secondary"
            style={{ padding: '0.85rem 1.6rem', fontSize: '0.95rem' }}
          >
            Notre Philosophie & Matières
          </a>
        </div>

        {/* Highlights Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            marginTop: '3.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--gold-light)' }}>
              100%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
              Matières Nobles & Durables
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--gold-light)' }}>
              48h
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
              {shipping.standardName ? 'Expédition Soignée 48h' : 'Livraison Rapide'}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: '700', color: 'var(--gold-light)' }}>
              {brand.ratingScore || '4.98/5'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
              {brand.ratingReviewsCount || '1 250+ avis vérifiés'}
            </div>
          </div>
        </div>
      </div>

      {/* Right Hero Image Card */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: '-10px',
            background: 'radial-gradient(circle, rgba(196, 155, 102, 0.2) 0%, transparent 70%)',
            filter: 'blur(30px)',
            zIndex: 0
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid var(--border-medium)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.75)',
            background: 'var(--bg-surface)'
          }}
        >
          <img
            src="/images/hero.jpg"
            alt={brand.name || "LUMEN Atelier"}
            style={{
              width: '100%',
              height: '460px',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />

          {/* Floating Quality Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              background: 'rgba(12, 13, 14, 0.88)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '1rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✦ Finition d'Atelier
              </span>
              <div style={{ fontSize: '0.92rem', fontWeight: '600', color: '#ffffff', marginTop: '2px' }}>
                Confection artisanale & séries limitées
              </div>
            </div>
            <span className="stock-pill stock-in" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
              En Stock • Expédition 24h
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
