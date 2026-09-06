import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  KeyRound,
  Package,
  Truck,
  ExternalLink,
  LogOut,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Trash2,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import InvoiceModal from './InvoiceModal';

export default function AccountModal() {
  const {
    user,
    isAuthModalOpen,
    setIsAuthModalOpen,
    sendOtpCode,
    verifyOtpCode,
    updateProfile,
    deleteAccount,
    logout,
    orders,
    loadingOrders
  } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile'
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Selected Order for Invoice modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isAddressCertified, setIsAddressCertified] = useState(false);
  const [_isSearchingAddress, setIsSearchingAddress] = useState(false);

  const handleExportData = async () => {
    if (!user || !user.email) return;
    try {
      const res = await fetch(`/api/auth/export-data?email=${encodeURIComponent(user.email)}`, {
        headers: { 'x-user-token': user.token || '' }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mes-donnees-lumen-${user.email.split('@')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Export RGPD téléchargé avec succès !', 'success');
      } else {
        showToast('Impossible d\'exporter les données.', 'error');
      }
    } catch (err) {
      console.error('Erreur export RGPD:', err);
      showToast('Erreur lors de l\'export des données.', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileAddress(user.address || '');
      setIsAddressCertified(!!user.address);
    }
  }, [user]);

  // Autocomplete address search (API Adresse Gouv)
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    setIsSearchingAddress(true);
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      if (data.features) {
        setAddressSuggestions(data.features.map(f => f.properties));
      }
    } catch (err) {
      console.error('Erreur API Adresse:', err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleAddressChange = (value) => {
    setProfileAddress(value);
    setIsAddressCertified(false);
    searchAddress(value);
  };

  const selectSuggestion = (suggestion) => {
    setProfileAddress(suggestion.label);
    setAddressSuggestions([]);
    setIsAddressCertified(true);
  };

  if (!isAuthModalOpen) return null;

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const res = await sendOtpCode(email, name, isRegister);
    setLoading(false);
    if (res.success) {
      setStep('code');
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    const res = await verifyOtpCode(email, code);
    setLoading(false);
    if (res.success) {
      setStep('email');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile({ name: profileName, address: profileAddress });
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const res = await deleteAccount();
    setDeleteLoading(false);
    if (res.success) {
      setDeleteConfirmOpen(false);
      setIsAuthModalOpen(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 3, 2, 0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          zIndex: 750,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={() => setIsAuthModalOpen(false)}
      >
        <div
          style={{
            background: 'linear-gradient(165deg, #1c130d 0%, #110b07 100%)',
            border: '1px solid var(--border-medium)',
            borderRadius: '24px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: 'var(--gold-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Espace Client & Commandes
              </span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--cream-bright)', marginTop: '2px' }}>
                {user ? `Bonjour, ${user.name || 'Client Privé'}` : 'Accès à votre Espace Client'}
              </h3>
            </div>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => setIsAuthModalOpen(false)}
              style={{ borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '2rem' }}>
            {/* 1. Unauthenticated View */}
            {!user ? (
              <div>
                {step === 'email' ? (
                  <form onSubmit={handleSendCode}>
                    <div style={{ marginBottom: '1.8rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          background: '#0d0805',
                          padding: '4px',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--border-subtle)',
                          marginBottom: '1.5rem'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setIsRegister(false)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            background: !isRegister ? 'var(--gold-primary)' : 'transparent',
                            color: !isRegister ? '#0b0705' : 'var(--cream-muted)',
                            fontWeight: '700',
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                          }}
                        >
                          Se Connecter
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRegister(true)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            background: isRegister ? 'var(--gold-primary)' : 'transparent',
                            color: isRegister ? '#0b0705' : 'var(--cream-muted)',
                            fontWeight: '700',
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                          }}
                        >
                          Créer un Compte
                        </button>
                      </div>

                      {isRegister && (
                        <div style={{ marginBottom: '1.2rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--cream-muted)', marginBottom: '6px' }}>
                            Nom & Prénom <span style={{ color: 'var(--gold-primary)' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--cream-dark)' }} />
                            <input
                              type="text"
                              required
                              placeholder="Jean Dupont"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.8rem 1rem 0.8rem 2.6rem',
                                background: '#0d0805',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '0.95rem'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--cream-muted)', marginBottom: '6px' }}>
                          Adresse E-mail <span style={{ color: 'var(--gold-primary)' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--cream-dark)' }} />
                          <input
                            type="email"
                            required
                            placeholder="vous@exemple.fr"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.8rem 1rem 0.8rem 2.6rem',
                              background: '#0d0805',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '0.95rem'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.9rem', justifyContent: 'center' }}
                    >
                      {loading ? 'Envoi en cours...' : isRegister ? 'Créer mon Compte & Recevoir le code' : 'Recevoir mon Code de Connexion'}
                      <ArrowRight size={18} />
                    </button>

                    <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--cream-dark)' }}>
                      🔒 Authentification sécurisée sans mot de passe par code temporaire à 6 chiffres.
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: 'rgba(212, 175, 55, 0.1)',
                          border: '1px solid var(--border-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1rem auto'
                        }}
                      >
                        <KeyRound size={24} color="var(--gold-primary)" />
                      </div>
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--cream-bright)', marginBottom: '4px' }}>
                        Code de Sécurité Envoyé
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--cream-muted)' }}>
                        Un code à 6 chiffres a été envoyé à <strong>{email}</strong>
                      </p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.trim())}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          textAlign: 'center',
                          fontSize: '1.8rem',
                          letterSpacing: '8px',
                          fontWeight: '800',
                          background: '#0d0805',
                          border: '2px solid var(--border-gold)',
                          borderRadius: '14px',
                          color: 'var(--gold-light)'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.9rem', justifyContent: 'center', marginBottom: '1rem' }}
                    >
                      {loading ? 'Validation en cours...' : 'Valider et Accéder à mon Espace'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--cream-muted)',
                        fontSize: '0.85rem',
                        display: 'block',
                        width: '100%',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      ← Modifier l'adresse e-mail
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* 2. Authenticated Dashboard View */
              <div>
                {/* Tabs Navigation */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '1rem',
                    marginBottom: '1.8rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    style={{
                      background: activeTab === 'orders' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                      border: activeTab === 'orders' ? '1px solid var(--gold-primary)' : '1px solid transparent',
                      color: activeTab === 'orders' ? 'var(--gold-light)' : 'var(--cream-muted)',
                      padding: '0.6rem 1.2rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.88rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Package size={16} /> Mes Commandes ({orders.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    style={{
                      background: activeTab === 'profile' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                      border: activeTab === 'profile' ? '1px solid var(--gold-primary)' : '1px solid transparent',
                      color: activeTab === 'profile' ? 'var(--gold-light)' : 'var(--cream-muted)',
                      padding: '0.6rem 1.2rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.88rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <User size={16} /> Mes Coordonnées
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      marginLeft: 'auto',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '8px'
                    }}
                  >
                    <LogOut size={15} /> Déconnexion
                  </button>
                </div>

                {/* Tab 1: Orders List */}
                {activeTab === 'orders' && (
                  <div>
                    {loadingOrders ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--cream-muted)' }}>
                        Chargement de vos commandes en direct...
                      </div>
                    ) : orders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--cream-muted)' }}>
                        <Package size={40} style={{ margin: '0 auto 1rem auto', color: 'var(--gold-primary)', opacity: 0.5 }} />
                        <p style={{ fontSize: '1.1rem', color: 'var(--cream-base)', fontWeight: '600' }}>
                          Aucune commande enregistrée pour le moment.
                        </p>
                        <p style={{ fontSize: '0.88rem', color: 'var(--cream-dark)', marginTop: '6px' }}>
                          Vos commandes apparaîtront ici avec facture téléchargeable et lien de suivi Colissimo.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {orders.map((order) => (
                          <div
                            key={order.orderId}
                            style={{
                              background: 'rgba(28, 19, 13, 0.75)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '18px',
                              padding: '1.4rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <strong style={{ fontSize: '1.05rem', color: 'var(--gold-light)' }}>{order.orderId}</strong>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--cream-dark)' }}>
                                    {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.88rem', color: 'var(--cream-muted)', marginTop: '4px' }}>
                                  {(order.items || []).map((item) => `${item.name} (x${item.quantity})`).join(', ')}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <strong style={{ fontSize: '1.15rem', color: 'var(--cream-bright)', display: 'block' }}>
                                  {order.totalAmount} €
                                </strong>
                                <span
                                  className={`stock-pill ${
                                    order.status === 'shipped' || order.status === 'delivered' ? 'stock-in' : 'stock-low'
                                  }`}
                                  style={{ marginTop: '4px' }}
                                >
                                  {order.status === 'shipped'
                                    ? '🚀 Colissimo Expédié'
                                    : order.status === 'delivered'
                                    ? '✅ Commande Livrée'
                                    : order.status === 'paid'
                                    ? '💳 Payée • En Préparation'
                                    : '⏳ En attente'}
                                </span>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px dashed rgba(212, 175, 55, 0.15)',
                                paddingTop: '10px',
                                marginTop: '10px',
                                flexWrap: 'wrap',
                                gap: '8px'
                              }}
                            >
                              {order.trackingNumber ? (
                                <a
                                  href={order.trackingUrl || `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(order.trackingNumber)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize: '0.82rem',
                                    color: 'var(--gold-light)',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(212, 175, 55, 0.12)',
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(212, 175, 55, 0.3)'
                                  }}
                                >
                                  <Truck size={14} /> Suivi Colissimo : <strong>{order.trackingNumber}</strong> <ExternalLink size={12} />
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--cream-dark)' }}>
                                  📦 Suivi Colissimo en cours de préparation logistique
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceOrder(order)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--cream-light)',
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  transition: 'var(--transition)'
                                }}
                              >
                                <FileText size={14} color="var(--gold-primary)" /> Facture PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Profile Settings & Coordinates */}
                {activeTab === 'profile' && (
                  <div>
                    {/* Coordinates Summary Card */}
                    <div
                      style={{
                        background: 'rgba(28, 19, 13, 0.6)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        padding: '1.4rem',
                        marginBottom: '1.8rem'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Coordonnées Actuelles Enregistrées
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--cream-dark)' }}>Nom / Contact :</span>
                          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--cream-bright)' }}>
                            {user.name || 'Non renseigné'}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--cream-dark)' }}>E-mail de connexion :</span>
                          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--cream-bright)' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit Form */}
                    <form onSubmit={handleSaveProfile}>
                      <div style={{ marginBottom: '1.4rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--cream-muted)', marginBottom: '6px' }}>
                          Nom complet
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Votre nom complet"
                          style={{
                            width: '100%',
                            padding: '0.8rem 1rem',
                            background: '#0d0805',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>

                      {/* Delivery Address with BAN Autocomplete */}
                      <div style={{ marginBottom: '1.8rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--cream-muted)' }}>
                            Adresse de Livraison par Défaut (Base BAN Officielle)
                          </label>
                          {isAddressCertified && (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                              <CheckCircle2 size={13} /> Adresse Certifiée
                            </span>
                          )}
                        </div>

                        <div style={{ position: 'relative' }}>
                          <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--gold-primary)' }} />
                          <input
                            type="text"
                            value={profileAddress}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            placeholder="Tapez votre adresse (ex: 12 Rue de la Paix, 75002 Paris)..."
                            style={{
                              width: '100%',
                              padding: '0.8rem 1rem 0.8rem 2.6rem',
                              background: '#0d0805',
                              border: isAddressCertified ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '0.95rem'
                            }}
                          />
                        </div>

                        {/* Suggestions Dropdown */}
                        {addressSuggestions.length > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              background: '#150e09',
                              border: '1px solid var(--border-medium)',
                              borderRadius: '12px',
                              marginTop: '6px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              zIndex: 20,
                              boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                            }}
                          >
                            {addressSuggestions.map((sug, idx) => (
                              <div
                                key={idx}
                                onClick={() => selectSuggestion(sug)}
                                style={{
                                  padding: '10px 14px',
                                  borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
                                  cursor: 'pointer',
                                  fontSize: '0.88rem',
                                  color: 'var(--cream-light)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)')}
                                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <span>{sug.label}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>{sug.postcode}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ padding: '0.8rem 1.8rem' }}
                      >
                        {loading ? 'Enregistrement...' : '💾 Mettre à Jour mes Coordonnées'}
                      </button>
                    </form>

                    {/* RGPD & Account Deletion Section */}
                    <div
                      style={{
                        marginTop: '3rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid rgba(239, 68, 68, 0.25)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', fontSize: '0.95rem', marginBottom: '6px' }}>
                        <AlertTriangle size={18} /> Gestion des Données Personnelles & Droit à l'Oubli (RGPD)
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--cream-muted)', lineHeight: '1.6', marginBottom: '1.2rem' }}>
                        Conformément au Règlement Général sur la Protection des Données (RGPD), vous pouvez demander la suppression de votre compte client. 
                        <strong> Remarque de sécurité :</strong> Si une commande est en cours de préparation ou d'acheminement Colissimo, la suppression est bloquée temporairement afin de garantir la livraison et le suivi de vos colis.
                      </p>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handleExportData}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(212, 175, 55, 0.12)',
                            color: 'var(--gold-primary)',
                            border: '1px solid var(--border-subtle)',
                            padding: '0.65rem 1.2rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <FileText size={16} /> Exporter mes Données (JSON RGPD)
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmOpen(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '0.65rem 1.2rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} /> Supprimer Définitivement mon Compte
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 850,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            style={{
              background: '#180f0a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '1rem' }}>
              <AlertTriangle size={26} />
              <h4 style={{ fontSize: '1.2rem', color: '#ffffff' }}>Confirmer la Suppression</h4>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--cream-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Êtes-vous sûr de vouloir supprimer définitivement le compte associé à <strong>{user?.email}</strong> ?
              Cette action désactivera vos identifiants d'accès. Vos factures passées resteront archivées conformément aux obligations comptables.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setDeleteConfirmOpen(false)}
                style={{ padding: '0.6rem 1.2rem' }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteAccount}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.65rem 1.4rem',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                {deleteLoading ? 'Suppression...' : 'Oui, Supprimer mon Compte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice PDF Printable Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </>
  );
}
