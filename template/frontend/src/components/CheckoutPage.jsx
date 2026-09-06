import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  MapPin,
  CheckCircle2,
  Edit3,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useShopConfig } from '../context/ShopConfigContext';

export default function CheckoutPage({ onBackToShop, onOrderSuccess, onOpenLegal }) {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const config = useShopConfig();
  const brand = config.brand || {};
  const promotions = config.promotions || [];

  const [currentStep, setCurrentStep] = useState(1); // 1: Coordonnées, 2: Livraison, 3: Paiement
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [_loadingAddress, setLoadingAddress] = useState(false);

  // Step 2: Shipping
  const [shippingMethod, setShippingMethod] = useState('colissimo'); // 'colissimo' | 'chronopost'

  // Step 3: Payment Method
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'apple_pay' | 'google_pay'

  // Step 3: Card Details (Simulated Fields)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [acceptCgv, setAcceptCgv] = useState(false);

  // Promo Code
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null); // { code: 'VANILLE10', rate: 0.10 }

  // Processing State
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Totals calculations
  const subtotal = getCartTotal();
  const shippingCfg = config.shipping || {};
  const freeThreshold = shippingCfg.freeShippingThreshold || 60;
  const standardCost = shippingCfg.standardCost || 4.90;
  const expressCost = shippingCfg.expressCost || 9.90;

  const rawDiscount = appliedDiscount ? subtotal * appliedDiscount.rate : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - rawDiscount);
  const isColissimoFree = subtotalAfterDiscount >= freeThreshold;
  const isExpress = shippingMethod === 'chronopost' || shippingMethod === 'express_chronopost';
  const shippingCost = isExpress ? expressCost : (isColissimoFree ? 0 : standardCost);
  const finalTotal = subtotalAfterDiscount + shippingCost;

  // Auto-fill from user context
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.address) {
        setAddress(user.address);
        const match = user.address.match(/\b(\d{5})\b\s+(.+)$/);
        if (match) {
          setPostcode(match[1]);
          setCity(match[2].trim());
          setIsAddressVerified(true);
        }
      }
    }
  }, [user]);

  // Debounced BAN Address Auto-complete
  useEffect(() => {
    if (!address || address.length < 4 || isAddressVerified) {
      setAddressSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingAddress(true);
      try {
        const query = `${address} ${postcode} ${city}`.trim();
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        if (data && data.features) {
          setAddressSuggestions(data.features);
        }
      } catch (err) {
        console.error('Erreur API Adresse:', err);
      } finally {
        setLoadingAddress(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [address, postcode, city, isAddressVerified]);

  const selectSuggestion = (feature) => {
    const props = feature.properties;
    setAddress(props.name || props.label);
    setPostcode(props.postcode || '');
    setCity(props.city || '');
    setIsAddressVerified(true);
    setAddressSuggestions([]);
    showToast('Adresse officielle certifiée Base Nationale (BAN)', 'success', 'Adresse Validée');
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    const matched = promotions.find(p => p.code.toUpperCase() === clean);
    
    if (matched) {
      if (matched.minAmount && subtotal < matched.minAmount) {
        showToast(`Ce code nécessite un minimum d'achat de ${matched.minAmount} €.`, 'warning', 'Code Promo');
        return;
      }
      setAppliedDiscount({ code: clean, rate: matched.rate, label: matched.label });
      showToast(`Code promo appliqué : ${matched.label}`, 'success', 'Code Promo Validé');
    } else if (clean === 'BIENVENUE10' || clean === 'LUMEN10') {
      setAppliedDiscount({ code: clean, rate: 0.10, label: '10% de bienvenue' });
      showToast('Code promo appliqué : -10% sur votre commande !', 'success', 'Code Promo Validé');
    } else if ((clean === 'LUMEN20' || clean === 'PROMO20') && subtotal >= 100) {
      setAppliedDiscount({ code: clean, rate: 0.20, label: '20% Remise Privilège' });
      showToast('Code Privilège appliqué : -20% !', 'success', 'Code Promo Validé');
    } else {
      showToast('Code promo invalide ou non éligible.', 'error', 'Code Promo');
    }
  };

  // Step 1 validation
  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    if (!name || !email || !address) {
      showToast('Veuillez compléter les informations obligatoires.', 'warning');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 validation
  const handleProceedToStep3 = (e) => {
    e.preventDefault();
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: Complete Payment
  const processFinalOrder = async (_methodType) => {
    if (!acceptCgv) {
      showToast('Veuillez accepter les Conditions Générales de Vente pour finaliser.', 'warning', 'CGV Requises');
      return;
    }

    if (cart.length === 0) {
      showToast('Votre panier est vide.', 'warning');
      return;
    }

    setLoadingPayment(true);

    try {
      const fullAddress = `${address.trim()}${postcode ? ` - ${postcode.trim()}` : ''}${city ? ` ${city.trim()}` : ''}`;
      
      // 1. Create Payment Intent & Order in Database
      const createRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity
          })),
          shippingMethod,
          promoCode: appliedDiscount ? appliedDiscount.code : (promoCode ? promoCode.trim() : null),
          customerInfo: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            address: fullAddress
          }
        })
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        showToast(createData.error || 'Erreur lors de la préparation de la commande.', 'error');
        setLoadingPayment(false);
        return;
      }

      const { orderId, isDemoMode } = createData;

      // 2. In Demo / Simulated Mode, confirm immediately
      if (isDemoMode) {
        const confirmRes = await fetch('/api/confirm-demo-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });

        const confirmData = await confirmRes.json();

        if (!confirmRes.ok || !confirmData.success) {
          showToast(confirmData.error || 'Erreur lors de la validation du paiement.', 'error');
          setLoadingPayment(false);
          return;
        }

        clearCart();
        showToast(`Commande ${orderId} validée avec succès !`, 'success', 'Paiement Réussi');
        onOrderSuccess(confirmData.order);
      } else {
        // Stripe Live checkout flow (hosted 3D-Secure / Apple Pay session)
        if (createData.checkoutUrl) {
          clearCart();
          showToast('Redirection vers la passerelle sécurisée Stripe...', 'info');
          window.location.href = createData.checkoutUrl;
          return;
        }
        showToast('Mode Stripe activé mais aucune URL de session Stripe reçue.', 'error');
      }
    } catch (err) {
      console.error('Erreur checkout:', err);
      showToast('Erreur de communication avec le serveur de paiement.', 'error');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem 6rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1.2rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <button
          type="button"
          onClick={onBackToShop}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--gold-light)',
            padding: '0.65rem 1.3rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.88rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <ArrowLeft size={16} /> Retour au Catalogue
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem', color: 'var(--gold-primary)' }}>{brand.logoEmoji || '✦'}</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: '700', color: '#fff' }}>
            {brand.name || 'LUMEN'}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--gold-primary)', marginLeft: '6px' }}>• Caisse Sécurisée</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem', fontWeight: '700' }}>
          <Lock size={15} /> SSL 256 Bits
        </div>
      </div>

      {/* Main Layout Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '2.5rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Multi-step Checkout Forms */}
        <div>
          {/* Stepper Navigation Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(28, 19, 13, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '1rem 1.5rem',
              marginBottom: '1.8rem'
            }}
          >
            <div
              onClick={() => setCurrentStep(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                opacity: currentStep === 1 ? 1 : 0.65
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: currentStep > 1 ? '#10b981' : currentStep === 1 ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)',
                  color: currentStep === 1 ? '#0d0906' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.85rem'
                }}
              >
                {currentStep > 1 ? <Check size={15} /> : '1'}
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: currentStep === 1 ? 'var(--gold-light)' : 'var(--cream-muted)' }}>
                Coordonnées
              </span>
            </div>

            <div style={{ height: '1px', width: '35px', background: 'var(--border-subtle)' }} />

            <div
              onClick={() => {
                if (currentStep === 1 && (!name || !email || !address)) {
                  showToast('Veuillez compléter vos coordonnées pour passer à la livraison.', 'info');
                } else {
                  setCurrentStep(2);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                opacity: currentStep === 2 ? 1 : 0.65
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: currentStep > 2 ? '#10b981' : currentStep === 2 ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)',
                  color: currentStep === 2 ? '#0d0906' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.85rem'
                }}
              >
                {currentStep > 2 ? <Check size={15} /> : '2'}
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: currentStep === 2 ? 'var(--gold-light)' : 'var(--cream-muted)' }}>
                Livraison
              </span>
            </div>

            <div style={{ height: '1px', width: '35px', background: 'var(--border-subtle)' }} />

            <div
              onClick={() => {
                if (!name || !email || !address) {
                  showToast('Veuillez compléter vos coordonnées pour accéder au règlement.', 'info');
                  setCurrentStep(1);
                } else {
                  setCurrentStep(3);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                opacity: currentStep === 3 ? 1 : 0.65
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: currentStep === 3 ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)',
                  color: currentStep === 3 ? '#0d0906' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.85rem'
                }}
              >
                3
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: currentStep === 3 ? 'var(--gold-light)' : 'var(--cream-muted)' }}>
                Règlement
              </span>
            </div>
          </div>

          {/* =========================================================================
              ÉTAPE 1 : COORDONNÉES & ADRESSE BAN
             ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToStep2} className="glass-panel" style={{ padding: '2.2rem' }}>
              <div style={{ marginBottom: '1.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Étape 1 sur 3
                </span>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--cream-bright)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="var(--gold-primary)" /> Coordonnées & Adresse de Livraison
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                    Nom & Prénom <span style={{ color: 'var(--gold-primary)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      background: '#0d0805',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                    Adresse E-mail <span style={{ color: 'var(--gold-primary)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jean@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      background: '#0d0805',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                  Numéro de Téléphone (Suivi SMS Colissimo)
                </label>
                <input
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: '#0d0805',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              {/* Address with BAN Autocomplete */}
              <div style={{ marginBottom: '1.8rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--cream-muted)' }}>
                    Recherche d'Adresse en France (Base BAN Officielle) <span style={{ color: 'var(--gold-primary)' }}>*</span>
                  </label>
                  {isAddressVerified && (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                      <CheckCircle2 size={13} /> Certifiée BAN
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  required
                  placeholder="Commencez à taper votre adresse..."
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setIsAddressVerified(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: '#0d0805',
                    border: isAddressVerified ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.92rem'
                  }}
                />

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
                      zIndex: 30,
                      boxShadow: '0 15px 40px rgba(0,0,0,0.9)'
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
                        <span>{sug.properties ? (sug.properties.label || sug.properties.name) : (sug.label || sug.name)}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: '700' }}>
                          {sug.properties ? sug.properties.postcode : sug.postcode}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.4rem' }}>
                <button type="submit" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
                  Continuer vers la Livraison <ChevronRight size={17} />
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              ÉTAPE 2 : MODE DE LIVRAISON
             ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleProceedToStep3} className="glass-panel" style={{ padding: '2.2rem' }}>
              <div style={{ marginBottom: '1.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Étape 2 sur 3
                </span>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--cream-bright)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={20} color="var(--gold-primary)" /> Choix du Transporteur
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {/* Colissimo Option */}
                <label
                  onClick={() => setShippingMethod('colissimo')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.2rem 1.4rem',
                    background: shippingMethod === 'colissimo' ? 'rgba(212, 175, 55, 0.14)' : 'rgba(28, 19, 13, 0.6)',
                    border: shippingMethod === 'colissimo' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'colissimo'}
                      onChange={() => setShippingMethod('colissimo')}
                      style={{ accentColor: 'var(--gold-primary)', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--cream-bright)' }}>
                        🚚 Colissimo Suivi Domicile (48h)
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                        Remise en boîte aux lettres avec numéro de suivi officiel
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.05rem', color: isColissimoFree ? '#34d399' : 'var(--gold-light)' }}>
                      {isColissimoFree ? 'OFFERT' : `${standardCost.toFixed(2)} €`}
                    </span>
                    {isColissimoFree && (
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#34d399', fontWeight: '600' }}>
                        Dès {freeThreshold} €
                      </span>
                    )}
                  </div>
                </label>

                {/* Chronopost Option */}
                <label
                  onClick={() => setShippingMethod('chronopost')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.2rem 1.4rem',
                    background: shippingMethod === 'chronopost' ? 'rgba(212, 175, 55, 0.14)' : 'rgba(28, 19, 13, 0.6)',
                    border: shippingMethod === 'chronopost' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'chronopost'}
                      onChange={() => setShippingMethod('chronopost')}
                      style={{ accentColor: 'var(--gold-primary)', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--cream-bright)' }}>
                        ⚡ Chronopost Express 24h Domicile
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                        Livraison le lendemain avant 13h remise contre signature
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--gold-light)' }}>
                      9.90 €
                    </span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.4rem' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setCurrentStep(1)}
                  style={{ fontSize: '0.88rem', padding: '0.6rem 0.8rem' }}
                >
                  ← Coordonnées
                </button>

                <button type="submit" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
                  Continuer vers le Paiement <ChevronRight size={17} />
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              ÉTAPE 3 : RÈGLEMENT HARMONISÉ & UNIFIÉ
             ========================================================================= */}
          {currentStep === 3 && (
            <div className="glass-panel" style={{ padding: '2.2rem' }}>
              <div style={{ marginBottom: '1.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Étape 3 sur 3
                </span>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--cream-bright)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={20} color="var(--gold-primary)" /> Choix du Mode de Règlement
                </h3>
              </div>

              {/* Compact Delivery Summary Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.4rem',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span>🚚</span>
                  <span style={{ color: 'var(--cream-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Livraison {shippingMethod === 'colissimo' ? 'Colissimo 48h' : 'Chronopost 24h'} à <strong>{name}</strong> ({city || address})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--gold-light)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}
                >
                  <Edit3 size={12} /> Modifier
                </button>
              </div>

              {/* Payment Mode Selector Tiles (Harmonious with Step 2) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.4rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.9rem 0.5rem',
                    background: paymentMethod === 'card' ? 'rgba(212, 175, 55, 0.16)' : 'rgba(28, 19, 13, 0.6)',
                    border: paymentMethod === 'card' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <span style={{ fontSize: '1.4rem', marginBottom: '4px' }}>💳</span>
                  <span style={{ fontWeight: '700', fontSize: '0.82rem', color: paymentMethod === 'card' ? 'var(--gold-light)' : 'var(--cream-light)' }}>
                    Carte Bancaire
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.9rem 0.5rem',
                    background: paymentMethod === 'apple_pay' ? 'rgba(212, 175, 55, 0.16)' : 'rgba(28, 19, 13, 0.6)',
                    border: paymentMethod === 'apple_pay' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 170 170" fill="currentColor" style={{ marginBottom: '4px', color: paymentMethod === 'apple_pay' ? 'var(--gold-light)' : '#fff' }}>
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.94.13-9.8-1.94-14.59-6.22-3.17-2.76-7.1-7.46-11.78-14.11-6.12-8.68-10.9-18.42-14.34-29.23-3.45-10.81-5.17-21.22-5.17-31.23 0-14.76 3.78-26.68 11.35-35.77 7.57-9.08 17.07-13.72 28.51-13.91 4.77 0 10.05 1.24 15.84 3.72 5.79 2.48 9.53 3.73 11.22 3.73 1.45 0 5.4-1.32 11.86-3.96 6.46-2.64 12.03-3.83 16.71-3.56 12.49.99 22.31 5.66 29.47 14.02-11.05 6.66-16.45 15.82-16.2 27.48.25 9.17 3.77 16.8 10.56 22.88 6.79 6.08 14.76 9.47 23.91 10.17-2.34 7.04-5.38 14.09-9.13 21.15zM119.22 31.84c0-7.39 2.66-14.48 7.98-21.27 5.32-6.79 12.16-10.57 20.53-11.34.13 1.01.2 1.83.2 2.46 0 7.33-2.73 14.44-8.19 21.33-5.46 6.89-12.37 10.63-20.72 11.23-.07-.75-.11-1.55-.11-2.41z"/>
                  </svg>
                  <span style={{ fontWeight: '700', fontSize: '0.82rem', color: paymentMethod === 'apple_pay' ? 'var(--gold-light)' : 'var(--cream-light)' }}>
                    Apple Pay
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('google_pay')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.9rem 0.5rem',
                    background: paymentMethod === 'google_pay' ? 'rgba(212, 175, 55, 0.16)' : 'rgba(28, 19, 13, 0.6)',
                    border: paymentMethod === 'google_pay' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" style={{ marginBottom: '4px' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA3323" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span style={{ fontWeight: '700', fontSize: '0.82rem', color: paymentMethod === 'google_pay' ? 'var(--gold-light)' : 'var(--cream-light)' }}>
                    Google Pay
                  </span>
                </button>
              </div>

              {/* Payment Details Area */}
              {paymentMethod === 'card' && (
                <div style={{ marginBottom: '1.4rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                      Numéro de Carte Bancaire
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        background: '#0d0805',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '0.95rem',
                        fontFamily: 'monospace',
                        letterSpacing: '1.5px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                        Expiration (MM/AA)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          background: '#0d0805',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '0.92rem',
                          fontFamily: 'monospace',
                          textAlign: 'center'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                        CVC (3 chiffres)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          background: '#0d0805',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '0.92rem',
                          fontFamily: 'monospace',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'apple_pay' && (
                <div style={{ padding: '1.2rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid var(--border-subtle)', marginBottom: '1.4rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                    Validation biométrique Touch ID / Face ID sur vos appareils Apple.
                  </p>
                  <button
                    type="button"
                    disabled={loadingPayment}
                    onClick={() => processFinalOrder('apple_pay')}
                    style={{
                      background: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '0.85rem 1.8rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="16" height="20" viewBox="0 0 170 170" fill="currentColor">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.94.13-9.8-1.94-14.59-6.22-3.17-2.76-7.1-7.46-11.78-14.11-6.12-8.68-10.9-18.42-14.34-29.23-3.45-10.81-5.17-21.22-5.17-31.23 0-14.76 3.78-26.68 11.35-35.77 7.57-9.08 17.07-13.72 28.51-13.91 4.77 0 10.05 1.24 15.84 3.72 5.79 2.48 9.53 3.73 11.22 3.73 1.45 0 5.4-1.32 11.86-3.96 6.46-2.64 12.03-3.83 16.71-3.56 12.49.99 22.31 5.66 29.47 14.02-11.05 6.66-16.45 15.82-16.2 27.48.25 9.17 3.77 16.8 10.56 22.88 6.79 6.08 14.76 9.47 23.91 10.17-2.34 7.04-5.38 14.09-9.13 21.15zM119.22 31.84c0-7.39 2.66-14.48 7.98-21.27 5.32-6.79 12.16-10.57 20.53-11.34.13 1.01.2 1.83.2 2.46 0 7.33-2.73 14.44-8.19 21.33-5.46 6.89-12.37 10.63-20.72 11.23-.07-.75-.11-1.55-.11-2.41z"/>
                    </svg>
                    Payer avec Apple Pay
                  </button>
                </div>
              )}

              {paymentMethod === 'google_pay' && (
                <div style={{ padding: '1.2rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid var(--border-subtle)', marginBottom: '1.4rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--cream-muted)', marginBottom: '1rem' }}>
                    Paiement rapide et sécurisé via votre compte Google Wallet.
                  </p>
                  <button
                    type="button"
                    disabled={loadingPayment}
                    onClick={() => processFinalOrder('google_pay')}
                    style={{
                      background: '#000',
                      color: '#fff',
                      border: '1px solid #444',
                      padding: '0.85rem 1.8rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Payer avec Google Pay</span>
                  </button>
                </div>
              )}

              {/* CGV Checkbox */}
              <div style={{ marginBottom: '1.6rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.82rem',
                    color: 'var(--cream-light)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    required
                    checked={acceptCgv}
                    onChange={(e) => setAcceptCgv(e.target.checked)}
                    style={{ accentColor: 'var(--gold-primary)', marginTop: '2px', width: '16px', height: '16px' }}
                  />
                  <span>
                    J'accepte les{' '}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onOpenLegal) onOpenLegal('cgv');
                      }}
                      style={{ color: 'var(--gold-light)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Conditions Générales de Vente
                    </span>{' '}
                    et la{' '}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onOpenLegal) onOpenLegal('privacy');
                      }}
                      style={{ color: 'var(--gold-light)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Politique de Confidentialité
                    </span>
                    .
                  </span>
                </label>
              </div>

              {/* Navigation & Submit Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.4rem' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setCurrentStep(2)}
                  style={{ fontSize: '0.88rem', padding: '0.6rem 0.8rem' }}
                >
                  ← Livraison
                </button>

                {paymentMethod === 'card' && (
                  <button
                    type="button"
                    disabled={loadingPayment}
                    onClick={() => processFinalOrder('card')}
                    className="btn-primary"
                    style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}
                  >
                    {loadingPayment ? 'Validation...' : `Payer ${finalTotal.toFixed(2)} €`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary & Promo Code */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h4 style={{ fontSize: '1.2rem', color: 'var(--cream-bright)', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            Résumé ({cart.length} {cart.length > 1 ? 'articles' : 'article'})
          </h4>

          {/* Cart Items Mini List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.4rem', maxHeight: '240px', overflowY: 'auto' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--cream-bright)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                    Quantité : {item.quantity} × {item.price.toFixed(2)} €
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--gold-light)', fontSize: '0.92rem' }}>
                  {(item.price * item.quantity).toFixed(2)} €
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code Input */}
          <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem' }}>
            <input
              type="text"
              placeholder="Code Promo (ex: VANILLE10)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              style={{
                flex: 1,
                padding: '0.7rem 0.9rem',
                background: '#0d0805',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
            <button
              type="submit"
              className="btn-secondary"
              style={{ padding: '0.7rem 1.2rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              Appliquer
            </button>
          </form>

          {appliedDiscount && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                color: '#34d399',
                marginBottom: '1.2rem'
              }}
            >
              <span>Code <strong>{appliedDiscount.code}</strong> actif</span>
              <button
                type="button"
                onClick={() => setAppliedDiscount(null)}
                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}
              >
                Supprimer
              </button>
            </div>
          )}

          {/* Price Breakdown */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem', marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--cream-muted)', marginBottom: '8px' }}>
              <span>Sous-total articles :</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>

            {rawDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#34d399', marginBottom: '8px' }}>
                <span>Remise appliquée :</span>
                <span>-{rawDiscount.toFixed(2)} €</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--cream-muted)', marginBottom: '8px' }}>
              <span>Livraison ({shippingMethod === 'colissimo' ? 'Colissimo 48h' : 'Chronopost 24h'}) :</span>
              <span style={{ color: shippingCost === 0 ? '#34d399' : 'inherit', fontWeight: shippingCost === 0 ? '700' : 'normal' }}>
                {shippingCost === 0 ? 'Offerte' : `${shippingCost.toFixed(2)} €`}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.3rem',
                fontWeight: '800',
                color: 'var(--cream-bright)',
                borderTop: '2px solid var(--border-gold)',
                paddingTop: '12px',
                marginTop: '10px'
              }}
            >
              <span>Total TTC :</span>
              <span style={{ color: 'var(--gold-glow)' }}>{finalTotal.toFixed(2)} €</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cream-dark)', textAlign: 'right', marginTop: '4px' }}>
              Dont TVA 5.5% incluse ({(finalTotal - finalTotal / 1.055).toFixed(2)} €)
            </div>
          </div>

          {/* Trust Guarantees */}
          <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--cream-light)', marginBottom: '6px' }}>
              <ShieldCheck size={16} color="var(--gold-primary)" /> Qualité Gourmet Noire non fendue garantie
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--cream-light)', marginBottom: '6px' }}>
              <Clock size={16} color="var(--gold-primary)" /> Expédition soignée sous 24/48h
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--cream-light)' }}>
              <Lock size={16} color="var(--gold-primary)" /> Paiement 100% sécurisé et certifié
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
