import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { useShopConfig } from '../context/ShopConfigContext';

export default function InvoiceModal({ order, onClose }) {
  const invoiceRef = useRef(null);
  const config = useShopConfig();
  const brand = config.brand || {};
  const legal = config.legal || {};

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];
  const totalTtc = parseFloat(order.totalAmount || 0);
  const totalHt = totalTtc / 1.20;
  const tvaAmount = totalTtc - totalHt;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 6, 8, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={onClose}
    >
      <div
        ref={invoiceRef}
        className="invoice-printable"
        style={{
          backgroundColor: '#ffffff',
          color: '#1a1b1e',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
          position: 'relative',
          fontFamily: 'var(--font-sans)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions bar (hidden in print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #eee',
            paddingBottom: '1rem'
          }}
        >
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0c0d0e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} /> Imprimer / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1a1b1e'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0c0d0e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--gold-primary)' }}>{brand.logoEmoji || '✦'}</span> {brand.name || 'LUMEN'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
              {legal.companyName || 'Lumen Atelier SAS'}<br />
              {legal.address || '14 Rue du Faubourg Saint-Honoré, 75008 Paris'}<br />
              {legal.contactEmail || 'contact@atelier-lumen.com'} • TVA {legal.tva || 'FR 32 912345678'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--gold-primary)' }}>
              FACTURE OFFICIELLE
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0c0d0e', marginTop: '4px' }}>
              N° {order.orderId}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
              Date : {new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        {/* Customer & Order Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
              Facturé à
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0c0d0e', marginTop: '4px' }}>
              {order.customerInfo?.name || 'Client'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              {order.customerInfo?.email}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
              📍 {order.customerInfo?.address || 'Adresse renseignée lors de la commande'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
              Règlement & Acheminement
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
              Mode de paiement : <strong>Carte Bancaire (Stripe)</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
              Statut : <span style={{ color: '#10b981', fontWeight: '700' }}>✓ Réglé intégralement</span>
            </div>
            {order.trackingNumber && (
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                Suivi : <strong>{order.trackingNumber}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #0c0d0e', textAlign: 'left', fontSize: '0.82rem', textTransform: 'uppercase', color: '#64748b' }}>
              <th style={{ paddingBottom: '8px' }}>Désignation de la Pièce</th>
              <th style={{ paddingBottom: '8px', textAlign: 'center' }}>Quantité</th>
              <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Prix Unitaire TTC</th>
              <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px 0', fontWeight: '600', color: '#0c0d0e' }}>
                  {item.name}
                </td>
                <td style={{ padding: '12px 0', textAlign: 'center', color: '#475569' }}>
                  x{item.quantity}
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right', color: '#475569' }}>
                  {parseFloat(item.unitPrice || 0).toFixed(2)} €
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '700', color: '#0c0d0e' }}>
                  {(parseFloat(item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
          <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Total HT :</span>
              <span>{totalHt.toFixed(2)} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>TVA (20%) :</span>
              <span>{tvaAmount.toFixed(2)} €</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: '800',
                color: '#0c0d0e',
                borderTop: '2px solid #0c0d0e',
                paddingTop: '8px',
                marginTop: '4px'
              }}
            >
              <span>Total TTC :</span>
              <span style={{ color: 'var(--gold-primary)' }}>{totalTtc.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
          Merci pour votre confiance. Pièces et objets authentiques conçus avec les plus hauts standards d'exigence.<br />
          {legal.companyName || 'Lumen Atelier SAS'} • Capital de {legal.capital || '50 000 €'} • Document certifié conforme à la facture dématérialisée.
        </div>
      </div>
    </div>
  );
}
