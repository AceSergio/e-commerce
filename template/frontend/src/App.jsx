import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BackgroundAmbient from './components/BackgroundAmbient';
import TerroirSection from './components/TerroirSection';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutPage from './components/CheckoutPage';
import OrderSuccessModal from './components/OrderSuccessModal';
import AccountModal from './components/AccountModal';
const AdminConsole = React.lazy(() => import('./components/AdminConsole'));
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import { ShieldCheck, Truck, Clock } from 'lucide-react';
import { useCart } from './context/CartContext';
import { useToast } from './context/ToastContext';
import { useShopConfig } from './context/ShopConfigContext';

export default function App() {
  const { isCheckoutOpen, setIsCheckoutOpen, setLastCompletedOrder } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [legalModalState, setLegalModalState] = useState({ isOpen: false, tab: 'cgv' });
  const { showToast } = useToast();
  const config = useShopConfig();
  const shipping = config.shipping || {};
  const legal = config.legal || {};

  const openLegalModal = (tab = 'cgv') => {
    setLegalModalState({ isOpen: true, tab });
  };

  const closeLegalModal = () => {
    setLegalModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      showToast('Impossible de charger le catalogue en direct', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Handle return from Stripe Checkout (e.g. ?success=true&order_id=... or ?canceled=true)
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        const orderId = params.get('order_id');
        showToast(
          orderId ? `Commande ${orderId} validée avec succès !` : 'Paiement validé avec succès !',
          'success',
          'Paiement Réussi'
        );
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('canceled') === 'true') {
        showToast('Paiement Stripe annulé. Vos articles sont toujours dans votre panier.', 'info');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }
  }, []);

  // Compute categories dynamically from product list
  const dynamicCategories = useMemo(() => {
    const cats = [{ id: 'all', label: 'Toutes les Pièces' }];
    const map = new Map();
    products.forEach((p) => {
      const cId = p.categoryId || p.category;
      if (cId && !map.has(cId)) {
        let label = cId;
        if (cId === 'ceramique-objets' || cId === 'ceramique') label = '🏺 Objets & Céramique';
        else if (cId === 'maison-ambiance' || cId === 'ambiance') label = '🕯️ Maison & Ambiance';
        else if (cId === 'essentiels') label = '✦ Les Essentiels';
        else if (cId === 'prestige') label = '✨ Collection Prestige';
        else label = cId.charAt(0).toUpperCase() + cId.slice(1);
        map.set(cId, label);
      }
    });

    map.forEach((label, id) => {
      cats.push({ id, label });
    });

    // If popular products exist, add popular filter
    if (products.some((p) => p.popular || p.isPopular)) {
      cats.splice(1, 0, { id: 'popular', label: '⭐ Sélections & Coups de Cœur' });
    }

    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    if (activeCategory === 'popular') return products.filter((p) => p.popular || p.isPopular);
    return products.filter((p) => (p.categoryId === activeCategory || p.category === activeCategory));
  }, [products, activeCategory]);

  if (isCheckoutOpen) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <BackgroundAmbient />
        <CheckoutPage
          onBackToShop={() => setIsCheckoutOpen(false)}
          onOrderSuccess={(order) => {
            setLastCompletedOrder(order);
            setIsCheckoutOpen(false);
          }}
          onOpenLegal={openLegalModal}
        />
        <OrderSuccessModal />
        <AccountModal />
        {isAdminOpen && (
          <React.Suspense fallback={null}>
            <AdminConsole
              isOpen={isAdminOpen}
              onClose={() => {
                setIsAdminOpen(false);
                fetchProducts();
              }}
            />
          </React.Suspense>
        )}
        <LegalModal
          isOpen={legalModalState.isOpen}
          onClose={closeLegalModal}
          initialTab={legalModalState.tab}
        />
        <Footer onOpenAdmin={() => setIsAdminOpen(true)} onOpenLegal={openLegalModal} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BackgroundAmbient />
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Manifeste & Piliers */}
        <TerroirSection />

        {/* 3. Product Catalogue Section */}
        <section
          id="catalogue"
          style={{
            padding: '5rem 1.5rem',
            maxWidth: '1280px',
            margin: '0 auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '3rem'
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--gold-primary)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.5px'
              }}
            >
              ✦ Catalogue d'Exception
            </span>
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: 'var(--cream-bright)',
                marginTop: '6px',
                marginBottom: '1rem',
                fontFamily: 'var(--font-serif)',
                fontWeight: '600'
              }}
            >
              Les Créations de l'Atelier
            </h2>
            <p style={{ color: 'var(--cream-muted)', maxWidth: '580px', fontSize: '1rem', lineHeight: '1.6' }}>
              Une sélection intemporelle de pièces d'art de vivre, façonnées dans le respect des matières et de la précision du geste.
            </p>

            {/* Filter Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: '2rem',
                background: 'var(--bg-card)',
                padding: '6px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {dynamicCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    background: activeCategory === cat.id ? 'var(--gold-gradient)' : 'transparent',
                    color: activeCategory === cat.id ? '#0c0d0e' : 'var(--cream-muted)',
                    fontWeight: activeCategory === cat.id ? '700' : '500',
                    fontSize: '0.88rem',
                    padding: '0.6rem 1.3rem',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem'
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '22px',
                    height: '420px',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--cream-muted)' }}>
              <p style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Aucune pièce ne correspond à cette sélection.</p>
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="btn-secondary"
                style={{ padding: '0.6rem 1.4rem' }}
              >
                Afficher toutes les pièces
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem'
              }}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. Engagements Banner */}
        <section
          id="engagements"
          style={{
            padding: '4rem 1.5rem',
            maxWidth: '1280px',
            margin: '0 auto'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #16181c 0%, #101215 100%)',
              border: '1px solid var(--border-medium)',
              borderRadius: '28px',
              padding: '3rem 2.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '2.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(196, 155, 102, 0.12)',
                  border: '1px solid rgba(196, 155, 102, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Truck size={22} color="var(--gold-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--cream-bright)', marginBottom: '4px', fontWeight: '600' }}>
                  {shipping.standardName || 'Livraison Suivie 48h'}
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--cream-muted)', lineHeight: '1.55' }}>
                  Emballage éco-conçu et numéro de suivi direct. Offerte dès {shipping.freeShippingThreshold || 60} € d'achats.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(196, 155, 102, 0.12)',
                  border: '1px solid rgba(196, 155, 102, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={22} color="var(--gold-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--cream-bright)', marginBottom: '4px', fontWeight: '600' }}>
                  Garantie Sérénité {legal.returnPeriodDays || 30} Jours
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--cream-muted)', lineHeight: '1.55' }}>
                  Paiement 100% sécurisé Stripe SSL et retours simples et gratuits sous {legal.returnPeriodDays || 30} jours.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(196, 155, 102, 0.12)',
                  border: '1px solid rgba(196, 155, 102, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Clock size={22} color="var(--gold-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--cream-bright)', marginBottom: '4px', fontWeight: '600' }}>
                  Service Client Dédié
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--cream-muted)', lineHeight: '1.55' }}>
                  Une équipe attentive à votre disposition par e-mail et téléphone pour vous accompagner dans vos choix.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer />
      <OrderSuccessModal />
      <AccountModal />
      {isAdminOpen && (
        <React.Suspense fallback={null}>
          <AdminConsole
            isOpen={isAdminOpen}
            onClose={() => {
              setIsAdminOpen(false);
              fetchProducts();
            }}
          />
        </React.Suspense>
      )}

      <LegalModal
        isOpen={legalModalState.isOpen}
        onClose={closeLegalModal}
        defaultTab={legalModalState.tab}
      />

      <Footer onOpenAdmin={() => setIsAdminOpen(true)} onOpenLegal={openLegalModal} />
    </div>
  );
}
