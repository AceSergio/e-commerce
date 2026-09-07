import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  Package,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Truck,
  Edit2,
  Save,
  LogOut,
  X,
  FileText,
  DollarSign,
  Activity,
  Layers,
  Users,
  Download,
  Check,
  Star,
  Terminal,
  Trash2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import InvoiceModal from './InvoiceModal';

export default function AdminConsole({ isOpen, onClose }) {
  const { showToast } = useToast();

  // Authentication State
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('admin_auth_token') || '');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Active Tab: 'dashboard' | 'orders' | 'customers' | 'products' | 'system'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core Data
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [_healthStatus, setHealthStatus] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productStockFilter, setProductStockFilter] = useState('all');

  // Modals & Drawers
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [tempTrackingNumber, setTempTrackingNumber] = useState('');
  const [editingProductModal, setEditingProductModal] = useState(null);

  // Inline Product Drafts map: productId -> { price, stockQuantity, popular, isSaving }
  const [productDrafts, setProductDrafts] = useState({});

  // System Logs State
  const [serverLogs, setServerLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logLevelFilter, setLogLevelFilter] = useState('all');
  const [logCategoryFilter, setLogCategoryFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [logStats, setLogStats] = useState({ total: 0, info: 0, warn: 0, error: 0 });
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);

  // Fetch Server Logs from API
  const fetchServerLogs = async () => {
    if (!adminToken) return;
    try {
      setLoadingLogs(true);
      const params = new URLSearchParams();
      if (logLevelFilter !== 'all') params.set('level', logLevelFilter);
      if (logCategoryFilter !== 'all') params.set('category', logCategoryFilter);
      if (logSearch.trim()) params.set('search', logSearch.trim());
      params.set('limit', '150');

      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: { 'x-admin-token': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        setServerLogs(data.logs || []);
        if (data.stats) setLogStats(data.stats);
      }
    } catch (err) {
      console.error('Erreur chargement logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Voulez-vous réinitialiser le journal des logs serveur ?')) return;
    try {
      const res = await fetch('/api/admin/logs', {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Journal des logs réinitialisé avec succès', 'success');
        fetchServerLogs();
      }
    } catch {
      showToast('Impossible de réinitialiser les logs', 'error');
    }
  };

  const handleDownloadLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs/download', {
        headers: { 'x-admin-token': adminToken }
      });
      if (!res.ok) throw new Error('Échec téléchargement');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumen-server-${new Date().toISOString().slice(0, 10)}.log`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Fichier app.log téléchargé avec succès', 'success');
    } catch {
      showToast('Erreur lors du téléchargement des logs', 'error');
    }
  };

  // 1. Fetch All Admin Data
  const fetchAdminData = async () => {
    if (!adminToken) return;
    setLoadingData(true);
    try {
      // Fetch Orders
      const ordersRes = await fetch('/api/orders', {
        headers: { 'x-admin-token': adminToken }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success && Array.isArray(ordersData.orders)) {
        setOrders(ordersData.orders);
      } else if (ordersRes.status === 401) {
        setAdminToken('');
        localStorage.removeItem('admin_auth_token');
        showToast('Session administrateur expirée.', 'warning');
      }

      // Fetch Products
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      if (prodData.success && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
        const drafts = {};
        prodData.products.forEach((p) => {
          drafts[p.id] = {
            price: p.price,
            stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity : (p.stock !== undefined ? p.stock : 100),
            popular: !!p.popular
          };
        });
        setProductDrafts(drafts);
      }

      // Fetch Health
      const healthRes = await fetch('/api/health');
      const healthData = await healthRes.json();
      setHealthStatus(healthData);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erreur chargement admin:', err);
      showToast('Impossible de contacter le serveur', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen && adminToken) {
      fetchAdminData();
    }
  }, [isOpen, adminToken]);

  useEffect(() => {
    if (isOpen && adminToken && activeTab === 'system') {
      fetchServerLogs();

      if (autoRefreshLogs) {
        const timer = setInterval(() => {
          fetchServerLogs();
        }, 4000);
        return () => clearInterval(timer);
      }
    }
  }, [isOpen, adminToken, activeTab, autoRefreshLogs, logLevelFilter, logCategoryFilter, logSearch]);

  // 2. Login & Logout
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoadingLogin(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setAdminToken(data.token);
        localStorage.setItem('admin_auth_token', data.token);
        setPassword('');
        showToast('Connexion à la Console Administration réussie !', 'success', 'Espace Direction');
      } else {
        showToast(data.error || 'Mot de passe administrateur incorrect', 'error', 'Accès Refusé');
      }
    } catch (err) {
      console.error('Erreur login admin:', err);
      showToast('Erreur de connexion au serveur', 'error');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    setAdminToken('');
    localStorage.removeItem('admin_auth_token');
    showToast('Déconnexion de la console administration.', 'info');
  };

  // 3. Update Order Status / Tracking
  const handleUpdateOrderStatus = async (orderId, newStatus, newTracking) => {
    try {
      const payload = { status: newStatus };
      if (newTracking !== undefined) payload.trackingNumber = newTracking;

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Commande ${orderId} mise à jour (${newStatus})`, 'success');
        setEditingOrderId(null);
        fetchAdminData();
      } else {
        showToast(data.error || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (err) {
      console.error('Erreur mise à jour commande:', err);
      showToast('Erreur serveur', 'error');
    }
  };

  // 4. Update Product Drafts & Inline Save
  const handleDraftChange = (productId, field, value) => {
    setProductDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleQuickAdjustStock = (productId, delta) => {
    const currentStock = productDrafts[productId]?.stockQuantity !== undefined ? productDrafts[productId].stockQuantity : 100;
    const newStock = Math.max(0, currentStock + delta);
    handleDraftChange(productId, 'stockQuantity', newStock);
  };

  const handleSaveProduct = async (product) => {
    const draft = productDrafts[product.id];
    if (!draft) return;

    try {
      const payload = {
        price: parseFloat(draft.price) || product.price,
        stockQuantity: parseInt(draft.stockQuantity, 10) || 0,
        popular: !!draft.popular
      };

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Produit "${product.name}" mis à jour avec succès !`, 'success', 'Stock & Prix Enregistrés');
        fetchAdminData();
      } else {
        showToast(data.error || 'Erreur lors de la sauvegarde du produit', 'error');
      }
    } catch (err) {
      console.error('Erreur update product:', err);
      showToast('Erreur de communication avec le serveur', 'error');
    }
  };

  // 5. Full Product Modal Save
  const handleSaveFullProductModal = async (e) => {
    e.preventDefault();
    if (!editingProductModal) return;

    try {
      const payload = {
        name: editingProductModal.name,
        subtitle: editingProductModal.subtitle,
        description: editingProductModal.description,
        price: parseFloat(editingProductModal.price),
        stockQuantity: parseInt(editingProductModal.stockQuantity, 10) || 0,
        unit: editingProductModal.unit,
        humidity: editingProductModal.humidity,
        vanillin: editingProductModal.vanillin,
        popular: !!editingProductModal.popular
      };

      const res = await fetch(`/api/products/${editingProductModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Fiche produit "${editingProductModal.name}" mise à jour !`, 'success');
        setEditingProductModal(null);
        fetchAdminData();
      } else {
        showToast(data.error || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (err) {
      console.error('Erreur full update product:', err);
      showToast('Erreur serveur', 'error');
    }
  };

  // 6. CSV Exports
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) {
      showToast('Aucune commande à exporter', 'info');
      return;
    }
    const headers = ['Référence', 'Date', 'Statut', 'Client', 'Email', 'Adresse', 'Total TTC (€)', 'Montant HT (€)', 'TVA 5.5% (€)', 'N° Suivi Colissimo'];
    const rows = orders.map((o) => {
      const ref = o.orderId || `ORD-${o.id}`;
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '';
      const status = o.status;
      const client = (o.customerInfo?.name || o.customerName || '').replace(/"/g, '""');
      const email = o.customerInfo?.email || o.customerEmail || '';
      const address = (o.customerInfo?.address || o.shippingAddress || '').replace(/"/g, '""');
      const totalTTC = (parseFloat(o.totalAmount) || 0).toFixed(2);
      const totalHT = (parseFloat(totalTTC) / 1.055).toFixed(2);
      const tva = (parseFloat(totalTTC) - parseFloat(totalHT)).toFixed(2);
      const tracking = o.trackingNumber || '';

      return `"${ref}","${date}","${status}","${client}","${email}","${address}",${totalTTC},${totalHT},${tva},"${tracking}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lumen_commandes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export CSV comptable des commandes téléchargé !', 'success');
  };

  const handleExportCustomersCSV = () => {
    if (customersList.length === 0) {
      showToast('Aucun client à exporter', 'info');
      return;
    }
    const headers = ['Nom Client', 'Email', 'Adresse Principale', 'Total Commandes', 'Total Dépensé TTC (€)'];
    const rows = customersList.map((c) => {
      const name = (c.name || '').replace(/"/g, '""');
      const email = c.email || '';
      const address = (c.address || '').replace(/"/g, '""');
      const orderCount = c.orderCount;
      const totalSpent = c.totalSpent.toFixed(2);
      return `"${name}","${email}","${address}",${orderCount},${totalSpent}`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lumen_clients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fichier client CRM exporté avec succès !', 'success');
  };

  // 7. Aggregated Metrics & Customer CRM
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered')
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
  }, [orders]);

  const _averageBasket = orders.length > 0 ? (totalRevenue / (orders.length || 1)).toFixed(2) : '0.00';
  const pendingOrdersCount = orders.filter((o) => o.status === 'paid' || o.status === 'pending').length;
  const shippedOrdersCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length;

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const draftStock = productDrafts[p.id]?.stockQuantity !== undefined ? productDrafts[p.id].stockQuantity : (p.stockQuantity !== undefined ? p.stockQuantity : p.stock || 0);
      return draftStock < 25;
    });
  }, [products, productDrafts]);

  // Aggregated Customers List
  const customersList = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const email = (o.customerInfo?.email || o.customerEmail || '').toLowerCase().trim();
      if (!email) return;
      const name = o.customerInfo?.name || o.customerName || 'Client';
      const address = o.customerInfo?.address || o.shippingAddress || '';
      const amount = parseFloat(o.totalAmount) || 0;

      if (!map.has(email)) {
        map.set(email, {
          email,
          name,
          address,
          orderCount: 1,
          totalSpent: amount,
          lastOrderDate: o.createdAt
        });
      } else {
        const existing = map.get(email);
        existing.orderCount += 1;
        existing.totalSpent += amount;
        if (!existing.address && address) existing.address = address;
        if (o.createdAt && (!existing.lastOrderDate || new Date(o.createdAt) > new Date(existing.lastOrderDate))) {
          existing.lastOrderDate = o.createdAt;
        }
      }
    });
    return Array.from(map.values());
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (orderSearch) {
        const q = orderSearch.toLowerCase();
        const ref = (o.orderId || `ORD-${o.id}`).toLowerCase();
        const client = (o.customerInfo?.name || o.customerName || '').toLowerCase();
        const email = (o.customerInfo?.email || o.customerEmail || '').toLowerCase();
        const tracking = (o.trackingNumber || '').toLowerCase();
        return ref.includes(q) || client.includes(q) || email.includes(q) || tracking.includes(q);
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      if (customerSearch) {
        const q = customerSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
      }
      return true;
    });
  }, [customersList, customerSearch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const draft = productDrafts[p.id] || {};
      const stock = draft.stockQuantity !== undefined ? draft.stockQuantity : (p.stockQuantity !== undefined ? p.stockQuantity : p.stock || 0);

      if (productStockFilter === 'low' && (stock >= 25 || stock <= 0)) return false;
      if (productStockFilter === 'out' && stock > 0) return false;
      if (productStockFilter === 'popular' && !draft.popular) return false;

      if (productSearch) {
        const q = productSearch.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, productDrafts, productStockFilter, productSearch]);

  // Sales Volume per Product Calculation
  const salesByProduct = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((it) => {
          const name = it.name || it.title || 'Vanille';
          const qty = parseInt(it.quantity, 10) || 1;
          const price = parseFloat(it.price) || 0;
          if (!counts[name]) counts[name] = { qty: 0, revenue: 0 };
          counts[name].qty += qty;
          counts[name].revenue += price * qty;
        });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [orders]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 3, 2, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1240px',
          height: '92vh',
          maxHeight: '920px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid var(--border-gold)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.92)'
        }}
      >
        {/* Top App Header */}
        <div
          style={{
            padding: '1.1rem 1.8rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(28, 19, 13, 0.98) 0%, rgba(18, 12, 8, 0.98) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(26, 18, 11, 0.95) 100%)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                color: 'var(--gold-primary)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              ✦
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: '700', color: '#fff', letterSpacing: '0.5px' }}>
                  LUMEN
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: 'rgba(196, 155, 102, 0.18)',
                    color: 'var(--gold-light)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  CONSOLE DIRECTION & CRM
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--cream-muted)' }}>
                Pilotage des commandes, gestion des stocks et expéditions
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {adminToken && (
              <>
                <button
                  type="button"
                  onClick={fetchAdminData}
                  disabled={loadingData}
                  style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--gold-light)',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '600'
                  }}
                  title="Rafraîchir les données en direct"
                >
                  <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} /> Actualiser
                </button>

                <button
                  type="button"
                  onClick={handleExportOrdersCSV}
                  style={{
                    background: 'linear-gradient(135deg, #dfbc45 0%, #aa8c2c 100%)',
                    border: 'none',
                    color: '#0b0705',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '700'
                  }}
                  title="Télécharger le relevé des commandes au format CSV"
                >
                  <Download size={14} /> Export CSV
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '600'
                  }}
                  title="Quitter la console admin"
                >
                  <LogOut size={14} /> Déconnexion
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--cream-muted)',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Fermer la console"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Auth or Dashboard Switch */}
        {!adminToken ? (
          /* =========================================================================
             LOGIN OVERLAY
             ========================================================================= */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <form
              onSubmit={handleLogin}
              style={{
                width: '100%',
                maxWidth: '430px',
                background: 'linear-gradient(165deg, #1c130d 0%, #110b07 100%)',
                border: '1px solid var(--border-gold)',
                borderRadius: '24px',
                padding: '2.5rem',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto'
                }}
              >
                <Lock size={28} color="var(--gold-primary)" />
              </div>

              <h3 style={{ fontSize: '1.45rem', color: '#fff', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>
                Espace Direction Sécurisé
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--cream-muted)', lineHeight: '1.5', marginBottom: '1.8rem' }}>
                Accès réservé à l'équipe d'administration LUMEN pour le pilotage des ventes et des stocks.
              </p>

              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '6px', fontWeight: '600' }}>
                  Mot de passe Administrateur
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.1rem',
                    background: '#0d0805',
                    border: '1px solid var(--border-gold)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1.05rem',
                    letterSpacing: '3px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loadingLogin}
                className="btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', borderRadius: '12px' }}
              >
                {loadingLogin ? 'Vérification...' : 'Déverrouiller le Tableau de Bord 🔓'}
              </button>

              <div style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--cream-dark)' }}>
                Mot de passe démo par défaut : <code style={{ color: 'var(--gold-light)' }}>admin2026</code>
              </div>
            </form>
          </div>
        ) : (
          /* =========================================================================
             MAIN PORTAL INTERFACE
             ========================================================================= */
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar Navigation */}
            <aside
              style={{
                width: '240px',
                borderRight: '1px solid var(--border-subtle)',
                background: 'rgba(18, 12, 8, 0.7)',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Tab 1: Dashboard */}
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: activeTab === 'dashboard' ? 'rgba(212, 175, 55, 0.16)' : 'transparent',
                    border: activeTab === 'dashboard' ? '1px solid var(--border-gold)' : '1px solid transparent',
                    color: activeTab === 'dashboard' ? 'var(--gold-light)' : 'var(--cream-muted)',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition)'
                  }}
                >
                  <Activity size={18} /> Vue d'Ensemble
                </button>

                {/* Tab 2: Orders */}
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: activeTab === 'orders' ? 'rgba(212, 175, 55, 0.16)' : 'transparent',
                    border: activeTab === 'orders' ? '1px solid var(--border-gold)' : '1px solid transparent',
                    color: activeTab === 'orders' ? 'var(--gold-light)' : 'var(--cream-muted)',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Package size={18} /> Commandes
                  </div>
                  {pendingOrdersCount > 0 && (
                    <span
                      style={{
                        background: 'var(--gold-primary)',
                        color: '#0d0906',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '10px'
                      }}
                    >
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>

                {/* Tab 3: Customers CRM */}
                <button
                  type="button"
                  onClick={() => setActiveTab('customers')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: activeTab === 'customers' ? 'rgba(212, 175, 55, 0.16)' : 'transparent',
                    border: activeTab === 'customers' ? '1px solid var(--border-gold)' : '1px solid transparent',
                    color: activeTab === 'customers' ? 'var(--gold-light)' : 'var(--cream-muted)',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={18} /> Fichier Clients
                  </div>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--cream-light)',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '10px'
                    }}
                  >
                    {customersList.length}
                  </span>
                </button>

                {/* Tab 4: Catalogue & Stocks */}
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: activeTab === 'products' ? 'rgba(212, 175, 55, 0.16)' : 'transparent',
                    border: activeTab === 'products' ? '1px solid var(--border-gold)' : '1px solid transparent',
                    color: activeTab === 'products' ? 'var(--gold-light)' : 'var(--cream-muted)',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Layers size={18} /> Stocks & Prix
                  </div>
                  {lowStockProducts.length > 0 && (
                    <span
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '2px 7px',
                        borderRadius: '10px'
                      }}
                    >
                      {lowStockProducts.length} alertes
                    </span>
                  )}
                </button>

                {/* Tab 5: System & Health */}
                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: activeTab === 'system' ? 'rgba(212, 175, 55, 0.16)' : 'transparent',
                    border: activeTab === 'system' ? '1px solid var(--border-gold)' : '1px solid transparent',
                    color: activeTab === 'system' ? 'var(--gold-light)' : 'var(--cream-muted)',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition)'
                  }}
                >
                  <ShieldAlert size={18} /> Système & Santé
                </button>
              </div>

              {/* Sidebar Footer Status */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--cream-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Serveur Express : Port 3000
                </div>
                <div>BDD SQLite : Active (Prisma)</div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
              {/* =========================================================================
                  TAB 1 : DASHBOARD OVERVIEW & ANALYTICS
                 ========================================================================= */}
              {activeTab === 'dashboard' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', color: '#fff', fontFamily: 'var(--font-serif)' }}>
                        Tableau de Bord Général
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                        Dernière synchronisation : {lastUpdated ? lastUpdated.toLocaleTimeString('fr-FR') : 'En direct'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportOrdersCSV}
                      style={{
                        background: 'rgba(212, 175, 55, 0.12)',
                        border: '1px solid var(--border-gold)',
                        color: 'var(--gold-light)',
                        padding: '0.55rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={14} /> Export Comptable CSV
                    </button>
                  </div>

                  {/* 4 Metric KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
                    {/* KPI 1 : Revenue */}
                    <div style={{ background: 'rgba(28, 19, 13, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '1.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                          Chiffre d'Affaires Brut
                        </span>
                        <DollarSign size={18} color="var(--gold-primary)" />
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--gold-glow)' }}>
                        {totalRevenue.toFixed(2)} €
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Commandes payées & confirmées
                      </div>
                    </div>

                    {/* KPI 2 : Orders Count */}
                    <div style={{ background: 'rgba(28, 19, 13, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '1.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                          Total Commandes
                        </span>
                        <Package size={18} color="var(--gold-primary)" />
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff' }}>
                        {orders.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', marginTop: '4px' }}>
                        {shippedOrdersCount} expédiées • {deliveredOrdersCount} livrées
                      </div>
                    </div>

                    {/* KPI 3 : Pending Shipments */}
                    <div style={{ background: 'rgba(28, 19, 13, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '1.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                          À Expédier Colissimo
                        </span>
                        <Truck size={18} color={pendingOrdersCount > 0 ? '#fbbf24' : '#10b981'} />
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '800', color: pendingOrdersCount > 0 ? '#fbbf24' : '#10b981' }}>
                        {pendingOrdersCount}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', marginTop: '4px' }}>
                        {pendingOrdersCount > 0 ? 'En attente de numéro de suivi' : 'Toutes les commandes sont expédiées'}
                      </div>
                    </div>

                    {/* KPI 4 : Stock Alerts */}
                    <div style={{ background: 'rgba(28, 19, 13, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '1.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>
                          Alertes Stocks
                        </span>
                        <AlertTriangle size={18} color={lowStockProducts.length > 0 ? '#f87171' : '#10b981'} />
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '800', color: lowStockProducts.length > 0 ? '#f87171' : '#10b981' }}>
                        {lowStockProducts.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', marginTop: '4px' }}>
                        {lowStockProducts.length > 0 ? 'Articles sous le seuil de 25 unités' : 'Stock optimal sur tous les formats'}
                      </div>
                    </div>
                  </div>

                  {/* Split Analytics: Sales per product + Recent Orders */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
                    {/* Sales breakdown card */}
                    <div style={{ background: 'rgba(28, 19, 13, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '1.6rem' }}>
                      <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} color="var(--gold-primary)" /> Répartition des Ventes par Produit
                      </h4>

                      {salesByProduct.length === 0 ? (
                        <div style={{ color: 'var(--cream-muted)', textAlign: 'center', padding: '2rem' }}>
                          Aucune donnée de vente enregistrée pour le moment.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {salesByProduct.map(([name, data]) => {
                            const percent = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(0) : 0;
                            return (
                              <div key={name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                  <span style={{ color: 'var(--cream-bright)', fontWeight: '600' }}>{name}</span>
                                  <span style={{ color: 'var(--gold-light)', fontWeight: '700' }}>
                                    {data.revenue.toFixed(2)} € <span style={{ color: 'var(--cream-muted)', fontWeight: 'normal' }}>({data.qty} vendus)</span>
                                  </span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${Math.max(5, percent)}%`,
                                      height: '100%',
                                      background: 'linear-gradient(90deg, #dfbc45 0%, #b89327 100%)',
                                      borderRadius: '4px'
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Recent Orders feed */}
                    <div style={{ background: 'rgba(28, 19, 13, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '1.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                        <h4 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Package size={18} color="var(--gold-primary)" /> Dernières Commandes
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActiveTab('orders')}
                          style={{ background: 'transparent', border: 'none', color: 'var(--gold-light)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Voir tout →
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {orders.slice(0, 5).map((o) => {
                          const ref = o.orderId || `ORD-${o.id}`;
                          return (
                            <div
                              key={ref}
                              style={{
                                padding: '10px 12px',
                                background: 'rgba(0,0,0,0.25)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: '700', color: 'var(--gold-light)' }}>{ref}</div>
                                <div style={{ color: 'var(--cream-muted)', fontSize: '0.78rem' }}>
                                  {o.customerInfo?.name || o.customerName || 'Client'}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '700', color: '#fff' }}>{o.totalAmount} €</div>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    color: o.status === 'delivered' ? '#34d399' : o.status === 'shipped' ? '#60a5fa' : 'var(--gold-light)'
                                  }}
                                >
                                  {o.status === 'delivered' ? 'Livrée' : o.status === 'shipped' ? 'Expédiée' : 'Payée'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  TAB 2 : ORDERS MANAGEMENT & DISPATCH
                 ========================================================================= */}
              {activeTab === 'orders' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', color: '#fff', fontFamily: 'var(--font-serif)' }}>
                        Commandes & Expéditions ({filteredOrders.length})
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                        Gestion des numéros de suivi Colissimo, statuts et factures PDF
                      </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Rechercher réf, nom, email, suivi..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          style={{
                            padding: '0.6rem 1rem 0.6rem 2.2rem',
                            background: '#0d0805',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            width: '260px'
                          }}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--cream-muted)' }} />
                      </div>

                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        style={{
                          padding: '0.6rem 1rem',
                          background: '#0d0805',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">Tous les statuts ({orders.length})</option>
                        <option value="paid">À expédier / Payées ({pendingOrdersCount})</option>
                        <option value="shipped">Expédiées ({shippedOrdersCount})</option>
                        <option value="delivered">Livrées ({deliveredOrdersCount})</option>
                        <option value="cancelled">Annulées</option>
                      </select>
                    </div>
                  </div>

                  {/* Orders Cards List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {filteredOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--cream-muted)', background: 'rgba(28, 19, 13, 0.4)', borderRadius: '18px' }}>
                        Aucune commande ne correspond aux critères sélectionnés.
                      </div>
                    ) : (
                      filteredOrders.map((order) => {
                        const orderRef = order.orderId || `ORD-${order.id}`;
                        const isEditingThis = editingOrderId === orderRef;

                        return (
                          <div
                            key={orderRef}
                            style={{
                              background: 'rgba(28, 19, 13, 0.85)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '18px',
                              padding: '1.5rem',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontWeight: '800', fontSize: '1.15rem', color: 'var(--gold-light)', letterSpacing: '0.5px' }}>
                                    {orderRef}
                                  </span>
                                  <span
                                    style={{
                                      padding: '3px 10px',
                                      borderRadius: '8px',
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      background:
                                        order.status === 'delivered'
                                          ? 'rgba(16, 185, 129, 0.15)'
                                          : order.status === 'shipped'
                                          ? 'rgba(59, 130, 246, 0.15)'
                                          : 'rgba(212, 175, 55, 0.15)',
                                      color:
                                        order.status === 'delivered'
                                          ? '#34d399'
                                          : order.status === 'shipped'
                                          ? '#60a5fa'
                                          : 'var(--gold-light)'
                                    }}
                                  >
                                    {order.status === 'delivered' ? 'Livrée' : order.status === 'shipped' ? 'Expédiée' : 'Payée • À préparer'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--cream-muted)', marginTop: '4px' }}>
                                  Passée le {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Récemment'}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceOrder(order)}
                                  style={{
                                    background: 'rgba(212, 175, 55, 0.12)',
                                    border: '1px solid var(--border-gold)',
                                    color: 'var(--gold-glow)',
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: '600'
                                  }}
                                >
                                  <FileText size={14} /> Facture PDF
                                </button>

                                {order.status === 'paid' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingOrderId(orderRef);
                                      setTempTrackingNumber(order.trackingNumber || `6A${Math.floor(10000000000 + Math.random() * 90000000000)}`);
                                    }}
                                    style={{
                                      background: '#3b82f6',
                                      color: '#fff',
                                      border: 'none',
                                      padding: '7px 14px',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      cursor: 'pointer',
                                      fontWeight: '700',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    <Truck size={14} /> Marquer Expédiée
                                  </button>
                                )}

                                {order.status === 'shipped' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(orderRef, 'delivered')}
                                    style={{
                                      background: '#10b981',
                                      color: '#fff',
                                      border: 'none',
                                      padding: '7px 14px',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      cursor: 'pointer',
                                      fontWeight: '700',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    <CheckCircle2 size={14} /> Marquer Livrée
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Tracking Input Bar */}
                            {isEditingThis && (
                              <div
                                style={{
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  borderRadius: '12px',
                                  padding: '1.2rem',
                                  marginBottom: '1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '14px'
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#93c5fd', marginBottom: '4px', fontWeight: '600' }}>
                                    Numéro de Suivi Colissimo La Poste :
                                  </label>
                                  <input
                                    type="text"
                                    value={tempTrackingNumber}
                                    onChange={(e) => setTempTrackingNumber(e.target.value)}
                                    placeholder="ex: 6A12345678901"
                                    style={{
                                      width: '100%',
                                      padding: '0.65rem 0.9rem',
                                      background: '#0d0805',
                                      border: '1px solid var(--border-subtle)',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      fontFamily: 'monospace',
                                      fontSize: '0.92rem'
                                    }}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(orderRef, 'shipped', tempTrackingNumber)}
                                    style={{
                                      background: '#3b82f6',
                                      color: '#fff',
                                      border: 'none',
                                      padding: '0.65rem 1.2rem',
                                      borderRadius: '8px',
                                      fontSize: '0.85rem',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Confirmer Expédition
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingOrderId(null)}
                                    style={{
                                      background: 'transparent',
                                      color: 'var(--cream-muted)',
                                      border: '1px solid var(--border-subtle)',
                                      padding: '0.65rem 1rem',
                                      borderRadius: '8px',
                                      fontSize: '0.85rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Client & Address Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--cream-bright)' }}>
                                  👤 {order.customerInfo?.name || order.customerName || 'Client'}
                                </div>
                                <div style={{ color: 'var(--cream-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                                  ✉️ {order.customerInfo?.email || order.customerEmail || '-'}
                                </div>
                                <div style={{ color: 'var(--cream-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                                  📍 {order.customerInfo?.address || order.shippingAddress || '-'}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '700', fontSize: '1.15rem', color: 'var(--gold-glow)' }}>
                                  Total : {order.totalAmount} €
                                </div>
                                {order.trackingNumber && (
                                  <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: '4px' }}>
                                    📦 Suivi : <code>{order.trackingNumber}</code>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ordered Items Breakdown */}
                            {Array.isArray(order.items) && order.items.length > 0 && (
                              <div style={{ fontSize: '0.82rem', color: 'var(--cream-muted)' }}>
                                <span style={{ fontWeight: '600', color: 'var(--gold-light)' }}>Articles commandés : </span>
                                {order.items.map((it, idx) => (
                                  <span key={idx}>
                                    {it.quantity}x {it.name || it.title} ({it.price}€){idx < order.items.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* =========================================================================
                  TAB 3 : CUSTOMER CRM
                 ========================================================================= */}
              {activeTab === 'customers' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', color: '#fff', fontFamily: 'var(--font-serif)' }}>
                        Fichier Clients CRM ({filteredCustomers.length})
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                        Historique d'achat, coordonnées de livraison et fidélité client
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Rechercher client, email..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          style={{
                            padding: '0.6rem 1rem 0.6rem 2.2rem',
                            background: '#0d0805',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            width: '240px'
                          }}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--cream-muted)' }} />
                      </div>

                      <button
                        type="button"
                        onClick={handleExportCustomersCSV}
                        style={{
                          background: 'rgba(212, 175, 55, 0.12)',
                          border: '1px solid var(--border-gold)',
                          color: 'var(--gold-light)',
                          padding: '0.55rem 1rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download size={14} /> Export CSV Clients
                      </button>
                    </div>
                  </div>

                  {/* Customer Table */}
                  <div style={{ background: 'rgba(28, 19, 13, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '18px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--gold-light)', fontWeight: '700' }}>
                          <th style={{ padding: '14px 16px' }}>Nom & Coordonnées</th>
                          <th style={{ padding: '14px 16px' }}>Adresse de Livraison</th>
                          <th style={{ padding: '14px 16px', textAlign: 'center' }}>Commandes</th>
                          <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total Ventes (LTV)</th>
                          <th style={{ padding: '14px 16px', textAlign: 'right' }}>Dernière Activité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
                              Aucun client trouvé.
                            </td>
                          </tr>
                        ) : (
                          filteredCustomers.map((c) => (
                            <tr
                              key={c.email}
                              style={{
                                borderBottom: '1px solid rgba(212, 175, 55, 0.08)',
                                transition: 'background 0.2s ease'
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(212, 175, 55, 0.06)')}
                              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: '700', color: 'var(--cream-bright)' }}>{c.name}</div>
                                <div style={{ color: 'var(--cream-muted)', fontSize: '0.78rem' }}>{c.email}</div>
                              </td>
                              <td style={{ padding: '14px 16px', color: 'var(--cream-muted)', maxWidth: '300px' }}>
                                {c.address || '-'}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-light)', padding: '3px 8px', borderRadius: '8px', fontWeight: '700', fontSize: '0.78rem' }}>
                                  {c.orderCount} cmd
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--gold-glow)' }}>
                                {c.totalSpent.toFixed(2)} €
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--cream-muted)', fontSize: '0.78rem' }}>
                                {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('fr-FR') : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  TAB 4 : PRODUCTS & INVENTORY MANAGER
                 ========================================================================= */}
              {activeTab === 'products' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', color: '#fff', fontFamily: 'var(--font-serif)' }}>
                        Catalogue des Vanilles & Stocks ({filteredProducts.length})
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                        Gestion des prix, quantités en stock, et fiches techniques en direct
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Rechercher un produit..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          style={{
                            padding: '0.6rem 1rem 0.6rem 2.2rem',
                            background: '#0d0805',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            width: '200px'
                          }}
                        />
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--cream-muted)' }} />
                      </div>

                      <select
                        value={productStockFilter}
                        onChange={(e) => setProductStockFilter(e.target.value)}
                        style={{
                          padding: '0.6rem 1rem',
                          background: '#0d0805',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">Tous les formats ({products.length})</option>
                        <option value="low">⚠️ Stock faible (&lt; 25)</option>
                        <option value="out">⛔ Rupture de stock</option>
                        <option value="popular">⭐ Grand Cru Stars</option>
                      </select>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.4rem' }}>
                    {filteredProducts.map((product) => {
                      const draft = productDrafts[product.id] || {
                        price: product.price,
                        stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity : (product.stock !== undefined ? product.stock : 100),
                        popular: !!product.popular
                      };

                      const isLow = draft.stockQuantity > 0 && draft.stockQuantity < 25;
                      const isOut = draft.stockQuantity <= 0;

                      return (
                        <div
                          key={product.id}
                          style={{
                            background: 'rgba(28, 19, 13, 0.85)',
                            border: isOut
                              ? '1px solid rgba(239, 68, 68, 0.6)'
                              : isLow
                              ? '1px solid rgba(245, 158, 11, 0.5)'
                              : '1px solid var(--border-subtle)',
                            borderRadius: '20px',
                            padding: '1.4rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '14px' }}>
                            <img
                              src={product.image}
                              alt={product.name}
                              onError={(e) => {
                                e.currentTarget.src = '/images/hero.jpg';
                              }}
                              style={{
                                width: '78px',
                                height: '78px',
                                objectFit: 'cover',
                                borderRadius: '14px',
                                border: '1px solid var(--border-subtle)',
                                flexShrink: 0
                              }}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '700', fontSize: '0.98rem', color: 'var(--cream-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {product.name}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--cream-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {product.subtitle || product.unit}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                {isOut ? (
                                  <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                    ⛔ RUPTURE
                                  </span>
                                ) : isLow ? (
                                  <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                    ⚠️ STOCK FAIBLE
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                    🟢 DISPONIBLE
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDraftChange(product.id, 'popular', !draft.popular)}
                                  style={{
                                    background: draft.popular ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    border: draft.popular ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                                    color: draft.popular ? 'var(--gold-light)' : 'var(--cream-dark)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Star size={11} fill={draft.popular ? 'currentColor' : 'none'} /> Star
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingProductModal({ ...product, ...draft })}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--gold-light)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    marginLeft: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontWeight: '600'
                                  }}
                                >
                                  <Edit2 size={12} /> Éditer
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Price & Stock Controls */}
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '12px', alignItems: 'center' }}>
                              {/* Price */}
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--cream-muted)', marginBottom: '4px' }}>
                                  Prix (€ TTC)
                                </label>
                                <input
                                  type="number"
                                  step="0.10"
                                  min="0"
                                  value={draft.price}
                                  onChange={(e) => handleDraftChange(product.id, 'price', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '0.45rem 0.6rem',
                                    background: '#0d0805',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px',
                                    color: 'var(--gold-light)',
                                    fontWeight: '700',
                                    fontSize: '0.9rem'
                                  }}
                                />
                              </div>

                              {/* Stock Steppers */}
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--cream-muted)', marginBottom: '4px' }}>
                                  Quantité en Stock
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdjustStock(product.id, -10)}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: '#fff', padding: '0.35rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                                    title="-10 unités"
                                  >
                                    -10
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdjustStock(product.id, -1)}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: '#fff', padding: '0.35rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                                    title="-1 unité"
                                  >
                                    -1
                                  </button>

                                  <input
                                    type="number"
                                    min="0"
                                    value={draft.stockQuantity}
                                    onChange={(e) => handleDraftChange(product.id, 'stockQuantity', parseInt(e.target.value, 10) || 0)}
                                    style={{
                                      width: '56px',
                                      textAlign: 'center',
                                      padding: '0.45rem 0.2rem',
                                      background: '#0d0805',
                                      border: '1px solid var(--border-subtle)',
                                      borderRadius: '8px',
                                      color: isOut ? '#f87171' : '#fff',
                                      fontWeight: '800',
                                      fontSize: '0.9rem'
                                    }}
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdjustStock(product.id, 1)}
                                    style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--border-gold)', color: 'var(--gold-light)', padding: '0.35rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                                    title="+1 unité"
                                  >
                                    +1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAdjustStock(product.id, 10)}
                                    style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--border-gold)', color: 'var(--gold-light)', padding: '0.35rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                                    title="+10 unités"
                                  >
                                    +10
                                  </button>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveProduct(product)}
                              style={{
                                width: '100%',
                                marginTop: '10px',
                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(26, 18, 11, 0.9) 100%)',
                                border: '1px solid var(--border-gold)',
                                color: 'var(--gold-light)',
                                padding: '0.55rem',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <Save size={14} /> Enregistrer ce Produit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================================================
                  TAB 5 : SYSTEM & DIAGNOSTICS
                 ========================================================================= */}
              {activeTab === 'system' && (
                <div>
                  <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                    Diagnostic & Intégrité Système
                  </h3>

                  <div style={{ background: 'rgba(28, 19, 13, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '1.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '14px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CheckCircle2 size={24} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1.15rem', color: '#fff' }}>
                          Plateforme LUMEN 100% Opérationnelle
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--cream-muted)', marginTop: '2px' }}>
                          Architecture découplée Node.js Express 5 • Prisma SQLite ORM • Chiffrement SSL 256 bits
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', fontSize: '0.88rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--cream-muted)', display: 'block', fontSize: '0.78rem' }}>Environnement Système</span>
                        <strong style={{ color: 'var(--gold-light)', fontSize: '1rem' }}>Production / Local</strong>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--cream-muted)', display: 'block', fontSize: '0.78rem' }}>Base de Données</span>
                        <strong style={{ color: '#10b981', fontSize: '1rem' }}>Connectée (Prisma SQLite)</strong>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--cream-muted)', display: 'block', fontSize: '0.78rem' }}>API Adresse Nationale</span>
                        <strong style={{ color: '#10b981', fontSize: '1rem' }}>Active (data.gouv.fr)</strong>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--cream-muted)', display: 'block', fontSize: '0.78rem' }}>Sécurité Session Admin</span>
                        <strong style={{ color: 'var(--gold-light)', fontSize: '1rem' }}>Jeton Chiffré Actif</strong>
                      </div>
                    </div>
                  </div>

                  {/* =========================================================================
                      LIVE LOG VIEWER & TERMINAL
                     ========================================================================= */}
                  <div style={{ marginTop: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.3rem', color: 'var(--cream-bright)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontFamily: 'var(--font-serif)' }}>
                          <Terminal size={22} color="var(--gold-primary)" /> Journal d'Événements & Supervision en Temps Réel
                        </h4>
                        <p style={{ fontSize: '0.84rem', color: 'var(--cream-muted)', marginTop: '4px' }}>
                          Surveillance continue des flux de commandes, paiements, sécurité OTP et transactions de stock.
                        </p>
                      </div>

                      {/* Stat Badges */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-subtle)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--cream-light)' }}>
                          Total : <strong style={{ color: '#fff' }}>{logStats.total || serverLogs.length}</strong>
                        </span>
                        <span style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', color: '#10b981' }}>
                          Info : <strong>{logStats.info || 0}</strong>
                        </span>
                        <span style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', color: '#f59e0b' }}>
                          Avertissements : <strong>{logStats.warn || 0}</strong>
                        </span>
                        <span style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', color: '#ef4444' }}>
                          Erreurs : <strong>{logStats.error || 0}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Toolbar & Filters */}
                    <div style={{ background: 'rgba(20, 14, 10, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: '16px 16px 0 0', padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      {/* Left: Filters & Search */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', minWidth: '200px' }}>
                          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--cream-dark)' }} />
                          <input
                            type="text"
                            placeholder="Filtrer les logs..."
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                            style={{
                              padding: '0.45rem 0.8rem 0.45rem 2.1rem',
                              background: '#0a0a0c',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '0.82rem',
                              width: '100%'
                            }}
                          />
                        </div>

                        {/* Level Filter Tabs */}
                        <div style={{ display: 'flex', gap: '4px', background: '#0a0a0c', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          {['all', 'info', 'warn', 'error'].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setLogLevelFilter(lvl)}
                              style={{
                                background: logLevelFilter === lvl ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                                border: logLevelFilter === lvl ? '1px solid var(--gold-primary)' : '1px solid transparent',
                                color: logLevelFilter === lvl ? 'var(--gold-light)' : 'var(--cream-muted)',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              {lvl === 'all' ? 'Tous' : lvl.toUpperCase()}
                            </button>
                          ))}
                        </div>

                        {/* Category Filter */}
                        <select
                          value={logCategoryFilter}
                          onChange={(e) => setLogCategoryFilter(e.target.value)}
                          style={{
                            padding: '0.45rem 0.8rem',
                            background: '#0a0a0c',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: 'var(--cream-light)',
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="all">Toutes Catégories</option>
                          <option value="AUTH">🔐 AUTH</option>
                          <option value="ORDER">📦 ORDER</option>
                          <option value="PAYMENT">💳 PAYMENT</option>
                          <option value="STOCK">📉 STOCK</option>
                          <option value="HTTP">🌐 HTTP</option>
                          <option value="SYSTEM">⚙️ SYSTEM</option>
                        </select>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--cream-muted)', cursor: 'pointer', marginRight: '6px' }}>
                          <input
                            type="checkbox"
                            checked={autoRefreshLogs}
                            onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                            style={{ accentColor: 'var(--gold-primary)' }}
                          />
                          Direct (4s)
                        </label>

                        <button
                          type="button"
                          onClick={fetchServerLogs}
                          disabled={loadingLogs}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--cream-light)',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                          title="Rafraîchir les logs"
                        >
                          <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
                          <span>Actualiser</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadLogs}
                          style={{
                            background: 'rgba(212, 175, 55, 0.12)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            color: 'var(--gold-light)',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                          title="Télécharger le fichier app.log"
                        >
                          <Download size={13} />
                          <span>Exporter</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearLogs}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                          title="Réinitialiser le buffer de logs"
                        >
                          <Trash2 size={13} />
                          <span>Vider</span>
                        </button>
                      </div>
                    </div>

                    {/* Dark Terminal Box */}
                    <div
                      style={{
                        background: '#07080a',
                        border: '1px solid var(--border-subtle)',
                        borderTop: 'none',
                        borderRadius: '0 0 16px 16px',
                        padding: '1rem',
                        height: '420px',
                        overflowY: 'auto',
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        fontSize: '0.82rem',
                        lineHeight: '1.6',
                        color: '#d1d5db',
                        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)'
                      }}
                    >
                      {serverLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--cream-dark)' }}>
                          <Terminal size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                          <p>Aucun événement enregistré correspondant aux filtres.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {serverLogs.map((log) => {
                            const isWarn = log.level === 'warn';
                            const isError = log.level === 'error';
                            const isDebug = log.level === 'debug';

                            const levelColor = isError ? '#ef4444' : isWarn ? '#f59e0b' : isDebug ? '#38bdf8' : '#10b981';
                            const levelBg = isError ? 'rgba(239, 68, 68, 0.15)' : isWarn ? 'rgba(245, 158, 11, 0.15)' : isDebug ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)';
                            const timeStr = log.timestamp ? log.timestamp.substring(11, 19) : '';

                            return (
                              <div
                                key={log.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'baseline',
                                  gap: '10px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.015)',
                                  borderLeft: `3px solid ${levelColor}`,
                                  wordBreak: 'break-word'
                                }}
                              >
                                <span style={{ color: '#6b7280', fontSize: '0.75rem', flexShrink: 0 }}>
                                  {timeStr}
                                </span>

                                <span
                                  style={{
                                    background: levelBg,
                                    color: levelColor,
                                    fontWeight: '700',
                                    fontSize: '0.7rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    flexShrink: 0
                                  }}
                                >
                                  {log.level}
                                </span>

                                <span
                                  style={{
                                    color: 'var(--gold-light)',
                                    fontWeight: '600',
                                    fontSize: '0.74rem',
                                    flexShrink: 0
                                  }}
                                >
                                  [{log.category || 'APP'}]
                                </span>

                                <span style={{ color: isError ? '#fca5a5' : isWarn ? '#fde68a' : '#e5e7eb', flex: 1 }}>
                                  {log.message}
                                  {log.details && (
                                    <span style={{ marginLeft: '8px', color: '#9ca3af', fontSize: '0.74rem' }}>
                                      {JSON.stringify(log.details)}
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* =========================================================================
          FULL PRODUCT EDIT MODAL
         ========================================================================= */}
      {editingProductModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setEditingProductModal(null)}
        >
          <div
            style={{
              background: 'linear-gradient(165deg, #1c130d 0%, #110b07 100%)',
              border: '1px solid var(--border-gold)',
              borderRadius: '24px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.95)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--gold-light)', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✏️ Modifier la Fiche Produit
              </h3>
              <button
                type="button"
                onClick={() => setEditingProductModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--cream-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFullProductModal}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                  Nom commercial du format
                </label>
                <input
                  type="text"
                  required
                  value={editingProductModal.name || ''}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0d0805', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                  Sous-titre / Type de conditionnement
                </label>
                <input
                  type="text"
                  value={editingProductModal.subtitle || ''}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, subtitle: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0d0805', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-light)', fontWeight: '700', marginBottom: '5px' }}>
                    Stock Réel en Réserve
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProductModal.stockQuantity}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '0.75rem', background: '#0d0805', border: '1px solid var(--border-gold)', borderRadius: '10px', color: 'var(--gold-light)', fontWeight: '700', fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                    Prix TTC (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProductModal.price}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, price: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', background: '#0d0805', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#fff', fontSize: '1rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                    💧 Taux d'Humidité
                  </label>
                  <input
                    type="text"
                    value={editingProductModal.humidity || ''}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, humidity: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', background: '#0d0805', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                    ✨ Taux de Vanilline
                  </label>
                  <input
                    type="text"
                    value={editingProductModal.vanillin || ''}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, vanillin: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', background: '#0d0805', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '5px' }}>
                  Description Commerciale & Notes Aromatiques
                </label>
                <textarea
                  rows={3}
                  value={editingProductModal.description || ''}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0d0805', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: '#fff', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="modal-popular-check"
                  checked={!!editingProductModal.popular}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, popular: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
                />
                <label htmlFor="modal-popular-check" style={{ color: 'var(--cream-light)', fontSize: '0.88rem', cursor: 'pointer' }}>
                  ⭐ Grand Cru Star (Mise en avant sur la boutique)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingProductModal(null)}
                  className="btn-secondary"
                  style={{ padding: '0.7rem 1.4rem' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.7rem 1.6rem' }}
                >
                  💾 Enregistrer la Fiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          INVOICE MODAL
         ========================================================================= */}
      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}
    </div>
  );
}
