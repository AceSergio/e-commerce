import React, { useState, useEffect } from 'react';
import { X, FileText, Lock, Scale } from 'lucide-react';
import { useShopConfig } from '../context/ShopConfigContext';

export default function LegalModal({ isOpen, defaultTab = 'cgv', initialTab, onClose }) {
  const currentInitial = defaultTab || initialTab || 'cgv';
  const [activeTab, setActiveTab] = useState(currentInitial);
  const config = useShopConfig();
  const brand = config.brand || {};
  const legal = config.legal || {};
  const shipping = config.shipping || {};

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab || initialTab || 'cgv');
    }
  }, [isOpen, defaultTab, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 6, 8, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 600,
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
          background: 'linear-gradient(165deg, #181a1e 0%, #101215 100%)',
          border: '1px solid var(--border-medium)',
          borderRadius: '24px',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.4rem 2rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem', color: 'var(--gold-primary)' }}>{brand.logoEmoji || '✦'}</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)' }}>
                Informations Légales & Conformité
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>
                {legal.companyName || `${brand.name || 'LUMEN'} SAS`} • Charte de Transparence
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: 'var(--cream-base)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            padding: '0 1rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('cgv')}
            style={{
              padding: '1rem 1.4rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'cgv' ? '2px solid var(--gold-primary)' : '2px solid transparent',
              color: activeTab === 'cgv' ? 'var(--gold-light)' : 'var(--cream-muted)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} /> Conditions Générales de Vente
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '1rem 1.4rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'privacy' ? '2px solid var(--gold-primary)' : '2px solid transparent',
              color: activeTab === 'privacy' ? 'var(--gold-light)' : 'var(--cream-muted)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Lock size={16} /> Politique RGPD
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mentions')}
            style={{
              padding: '1rem 1.4rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'mentions' ? '2px solid var(--gold-primary)' : '2px solid transparent',
              color: activeTab === 'mentions' ? 'var(--gold-light)' : 'var(--cream-muted)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Scale size={16} /> Mentions Légales
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, fontSize: '0.92rem', lineHeight: '1.7' }}>
          {activeTab === 'cgv' && (
            <div>
              <h3 style={{ color: 'var(--gold-light)', fontSize: '1.4rem', marginBottom: '0.4rem', fontFamily: 'var(--font-serif)' }}>
                Conditions Générales de Vente (CGV)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--gold-primary)', marginBottom: '1.5rem' }}>
                Dernière mise à jour : Août {new Date().getFullYear()}
              </p>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                1. Objet & Champ d'application
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des ventes conclues sur le site internet <strong>{brand.name || 'LUMEN'}</strong> entre la société <strong>{legal.companyName || 'Lumen Atelier SAS'}</strong> et tout acheteur. Toute passation de commande implique l'adhésion entière aux présentes dispositions.
              </p>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                2. Produits & Tarification
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                Les fiches produits présentent les caractéristiques essentielles des créations et pièces proposées. Les prix sont exprimés en Euros (€) Toutes Taxes Comprises (TTC). La livraison standard est <strong>offerte à partir de {shipping.freeShippingThreshold || 60},00 € TTC</strong> d'achat (facturée {shipping.standardCost || 4.90} € en deçà).
              </p>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                3. Commande, Paiement & Livraison
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                Le règlement s'opère par carte bancaire sécurisée via protocole de chiffrement SSL. Les expéditions sont prises en charge dans un délai moyen de {shipping.standardDelay || '24h à 48h ouvrées'} avec suivi en temps réel.
              </p>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                4. Droit de Rétractation & Retours
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                Conformément à la législation européenne, vous bénéficiez d'un délai de rétractation de <strong>{legal.returnPeriodDays || 30} jours</strong> à compter de la réception de vos articles pour demander un échange ou un remboursement intégral.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h3 style={{ color: 'var(--gold-light)', fontSize: '1.4rem', marginBottom: '0.4rem', fontFamily: 'var(--font-serif)' }}>
                Politique de Confidentialité & Protection RGPD
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--gold-primary)', marginBottom: '1.5rem' }}>
                Conformité Règlement Général sur la Protection des Données (UE 2016/679)
              </p>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                1. Responsable du Traitement
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                Le responsable du traitement des données personnelles est <strong>{legal.companyName || 'Lumen Atelier SAS'}</strong>, domiciliée au {legal.address || '14 Rue du Faubourg Saint-Honoré, 75008 Paris'} (contact : {legal.contactEmail || 'privacy@atelier-lumen.com'}).
              </p>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                2. Données Collectées & Finalités
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                Nous collectons uniquement les informations indispensables au traitement de vos commandes et à la sécurisation de vos accès :
              </p>
              <ul style={{ paddingLeft: '1.4rem', color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                <li><strong>Identité & Contact :</strong> Nom, prénom, e-mail, téléphone (utilisés pour les notifications d'expédition et l'authentification OTP).</li>
                <li><strong>Livraison & Facturation :</strong> Adresse postale complète certifiée pour l'acheminement des colis.</li>
                <li><strong>Historique d'achat :</strong> Commandes passées, montants et numéros de suivi associés.</li>
              </ul>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  color: '#6ee7b7',
                  fontSize: '0.88rem',
                  marginBottom: '1rem'
                }}
              >
                🔒 <strong>Engagement strict de confidentialité :</strong> Aucune donnée n'est vendue, louée ou cédée à des courtiers ou régies publicitaires tierces.
              </div>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                3. Vos Droits & Droit à l'Oubli
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                Vous disposez d'un droit permanent d'accès, de rectification et d'effacement de vos données, exerçable directement depuis votre <em>Espace Compte</em>.
              </p>
            </div>
          )}

          {activeTab === 'mentions' && (
            <div>
              <h3 style={{ color: 'var(--gold-light)', fontSize: '1.4rem', marginBottom: '0.4rem', fontFamily: 'var(--font-serif)' }}>
                Mentions Légales
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--gold-primary)', marginBottom: '1.5rem' }}>
                Informations relatives à l'éditeur et à l'hébergement du site
              </p>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                1. Éditeur de la Plateforme
              </h4>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '1.2rem',
                  marginBottom: '1.2rem',
                  color: 'var(--cream-muted)'
                }}
              >
                <strong style={{ color: '#fff', fontSize: '1rem', display: 'block', marginBottom: '6px' }}>
                  {legal.companyName || 'Lumen Atelier SAS'}
                </strong>
                Société par Actions Simplifiée au capital de {legal.capital || '50 000 €'}<br />
                <strong>RCS :</strong> {legal.rcs || 'Paris B 912 345 678'}<br />
                <strong>SIRET :</strong> {legal.siret || '912 345 678 00014'}<br />
                <strong>N° TVA Intracommunautaire :</strong> {legal.tva || 'FR 32 912345678'}<br />
                <strong>Siège Social :</strong> {legal.address || '14 Rue du Faubourg Saint-Honoré, 75008 Paris, France'}<br />
                <strong>Contact E-mail :</strong> {legal.contactEmail || 'contact@atelier-lumen.com'}
              </div>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                2. Hébergement & Sécurité
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                Le site et ses bases de données sont hébergés au sein de centres de données hautement sécurisés dans l'Union Européenne, certifiés ISO 27001 et conformes aux normes PCI-DSS.
              </p>

              <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1.2rem', marginBottom: '0.4rem' }}>
                3. Propriété Intellectuelle
              </h4>
              <p style={{ color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                L'ensemble des photographies, textes, identités visuelles et structures logicielles sont la propriété exclusive de {legal.companyName || 'Lumen Atelier SAS'}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1.2rem 2rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--bg-surface)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '0.65rem 1.8rem', fontSize: '0.9rem', borderRadius: '12px' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
