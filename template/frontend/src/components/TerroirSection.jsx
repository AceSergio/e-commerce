import React from 'react';
import { Layers, ShieldCheck, Truck, Feather } from 'lucide-react';
import { useShopConfig } from '../context/ShopConfigContext';

export default function TerroirSection() {
  const config = useShopConfig();
  const brand = config.brand || {};
  const shipping = config.shipping || {};

  const pillars = [
    {
      icon: <Feather size={24} color="var(--gold-primary)" />,
      title: "Matières Nobles & Durables",
      desc: "Chaque matériau (grès minéral, lin pur lavé, laiton brossé, verre borosilicate) est sélectionné pour sa longévité et sa beauté brute."
    },
    {
      icon: <Layers size={24} color="var(--gold-primary)" />,
      title: "Savoir-Faire Artisanal",
      desc: "Créations façonnées en séries limitées par des ateliers passionnés, alliant rigueur des proportions et finitions soignées à la main."
    },
    {
      icon: <Truck size={24} color="var(--gold-primary)" />,
      title: "Expédition Sécurisée 48h",
      desc: `Emballages éco-responsables protecteurs sur-mesure. Livraison offerte dès ${shipping.freeShippingThreshold || 60}€ avec numéro de suivi en direct.`
    },
    {
      icon: <ShieldCheck size={24} color="var(--gold-primary)" />,
      title: "Transparence & Garantie",
      desc: `Paiement sécurisé par carte bancaire ou Stripe, suivi de commande en temps réel et retours garantis sous ${config.legal?.returnPeriodDays || 30} jours.`
    }
  ];

  return (
    <section
      id="manifeste"
      style={{
        padding: '5rem 1.5rem',
        maxWidth: '1280px',
        margin: '0 auto',
        borderTop: '1px solid var(--border-subtle)'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3.5rem auto' }}>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--gold-primary)',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1.5px'
          }}
        >
          ✦ Notre Manifeste
        </span>
        <h2
          style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            color: 'var(--cream-bright)',
            marginTop: '8px',
            marginBottom: '1rem',
            fontFamily: 'var(--font-serif)'
          }}
        >
          Les 4 Piliers de l'Excellence {brand.name || 'LUMEN'}
        </h2>
        <p style={{ color: 'var(--cream-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
          De la conception à l'atelier, nous défendons une vision intemporelle de l'objet : durable, épuré et fonctionnel.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {pillars.map((pillar, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '2.2rem 1.8rem',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(196, 155, 102, 0.4)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.background = 'var(--bg-card-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'var(--bg-card)';
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(196, 155, 102, 0.12)',
                border: '1px solid rgba(196, 155, 102, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.4rem'
              }}
            >
              {pillar.icon}
            </div>
            <h3
              style={{
                fontSize: '1.18rem',
                color: 'var(--cream-bright)',
                marginBottom: '0.6rem',
                fontWeight: '600'
              }}
            >
              {pillar.title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--cream-muted)', lineHeight: '1.65' }}>
              {pillar.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
