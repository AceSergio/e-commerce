import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Truck, ExternalLink, ArrowRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function OrderSuccessModal() {
  const { lastCompletedOrder, setLastCompletedOrder } = useCart();

  useEffect(() => {
    if (lastCompletedOrder) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c49b66', '#f1f5f9', '#ffffff', '#10b981']
        });
      } catch (e) {
        console.log('Confetti non disponible:', e);
      }
    }
  }, [lastCompletedOrder]);

  if (!lastCompletedOrder) return null;

  const trackingNumber = lastCompletedOrder.trackingNumber || 'En cours de préparation';
  const trackingUrl =
    lastCompletedOrder.trackingUrl ||
    (lastCompletedOrder.trackingNumber
      ? `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(lastCompletedOrder.trackingNumber)}`
      : null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 6, 8, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={() => setLastCompletedOrder(null)}
    >
      <div
        style={{
          background: 'linear-gradient(165deg, #181a1e 0%, #101215 100%)',
          border: '1px solid var(--border-medium)',
          borderRadius: '24px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setLastCompletedOrder(null)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
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

        {/* Success Icon */}
        <div
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}
        >
          <CheckCircle2 size={40} color="#10b981" />
        </div>

        <span style={{ fontSize: '0.82rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          Paiement Confirmé
        </span>

        <h2 style={{ fontSize: '2rem', color: 'var(--cream-bright)', marginTop: '4px', marginBottom: '0.6rem' }}>
          Merci pour votre commande !
        </h2>

        <p style={{ color: 'var(--cream-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.8rem' }}>
          Votre commande a été enregistrée avec succès. Un e-mail de confirmation et votre facture vous ont été adressés à{' '}
          <strong style={{ color: 'var(--gold-light)' }}>{lastCompletedOrder.customerInfo?.email || 'votre adresse'}</strong>.
        </p>

        {/* Order Details Card */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.4rem',
            textAlign: 'left',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--cream-muted)' }}>Référence Commande :</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--gold-light)' }}>{lastCompletedOrder.orderId}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--cream-muted)' }}>Montant Total Réglé :</span>
            <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>{lastCompletedOrder.totalAmount} €</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--cream-muted)' }}>Adresse de Livraison :</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--cream-base)', maxWidth: '280px', textAlign: 'right' }}>
              📍 {lastCompletedOrder.customerInfo?.address || 'Adresse enregistrée'}
            </span>
          </div>

          {/* Tracking Box */}
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="var(--gold-primary)" />
              <div style={{ fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--cream-muted)' }}>N° de Suivi : </span>
                <strong style={{ color: 'var(--gold-light)' }}>{trackingNumber}</strong>
              </div>
            </div>

            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--gold-light)',
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Suivre <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLastCompletedOrder(null)}
          className="btn-primary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
        >
          <span>Retourner à la Boutique</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
