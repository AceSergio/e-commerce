// LUMEN Standalone Admin Dashboard Logic
const API_BASE = 'http://localhost:3000/api';

let adminToken = localStorage.getItem('admin_auth_token') || null;
let allOrders = [];
let allProducts = [];
let currentOrderFilter = 'all';
let salesChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  if (adminToken) {
    showDashboard();
  } else {
    showLogin();
  }

  setupEventListeners();
});

// HTML Sanitization to prevent XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Toast Notification System
function showToast(message, type = 'success', title = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✅',
    error: '⚠️',
    info: '🌿'
  };

  const titleHtml = title ? `<strong style="display: block; font-size: 0.85rem; color: var(--gold-glow); margin-bottom: 2px;">${title}</strong>` : '';

  toast.innerHTML = `
    <span style="font-size: 1.3rem; line-height: 1;">${iconMap[type] || '✨'}</span>
    <div style="flex: 1; line-height: 1.4; padding-right: 6px;">
      ${titleHtml}
      <div>${message}</div>
    </div>
    <button type="button" class="toast-close-btn" aria-label="Fermer la notification">&times;</button>
    <div class="toast-progress"></div>
  `;

  const dismissToast = () => {
    if (toast.classList.contains('toast-hiding')) return;
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  };

  const timer = setTimeout(dismissToast, 3500);

  toast.querySelector('.toast-close-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearTimeout(timer);
    dismissToast();
  });

  container.appendChild(toast);
}

// UI State Toggles
function showLogin() {
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('dashboard-app').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('dashboard-app').style.display = 'grid';
  loadDashboardData();
}

// Event Listeners Registration
function setupEventListeners() {
  // Login Form Submit
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-pass').value;
    const loginBtn = document.getElementById('login-btn');

    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Connexion en cours...';

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      adminToken = data.token;
      localStorage.setItem('admin_auth_token', adminToken);
      showToast('Authentification réussie ! Bienvenue Admin.', 'success', 'Connexion Réussie');
      showDashboard();
    } catch (err) {
      showToast(`Erreur d'accès : ${err.message}`, 'error', 'Authentification Échouée');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = '🔑 Se Connecter au Dashboard';
    }
  });

  // Logout Button
  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    adminToken = null;
    localStorage.removeItem('admin_auth_token');
    showToast('Session fermée avec succès', 'info', 'Déconnexion');
    showLogin();
  });

  // Sidebar Tab Switching
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');

      btn.classList.add('active');
      const targetTabId = btn.getAttribute('data-tab');
      const targetSection = document.getElementById(targetTabId);
      if (targetSection) targetSection.style.display = 'block';

      // Update page title
      const titles = {
        'tab-overview': '📊 Vue d\'Ensemble & Analytics',
        'tab-orders': '📦 Gestionnaire des Commandes',
        'tab-customers': '👥 Répertoire Clientèle CRM',
        'tab-products': '🏷️ Catalogue des Produits & Stocks'
      };
      document.getElementById('page-title').textContent = titles[targetTabId] || 'Dashboard Admin';
    });
  });

  // Order Filters
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderFilter = btn.getAttribute('data-order-filter') || 'all';
      renderOrdersTable();
    });
  });

  // Search Orders Input
  document.getElementById('search-orders-input')?.addEventListener('input', () => {
    renderOrdersTable();
  });

  // Refresh Button
  document.getElementById('refresh-data-btn')?.addEventListener('click', () => {
    loadDashboardData();
    showToast('Données et statistiques actualisées', 'info', 'Base de Données');
  });

  // CSV Exports
  document.getElementById('export-csv-btn')?.addEventListener('click', exportOrdersCSV);
  document.getElementById('export-customers-csv')?.addEventListener('click', exportCustomersCSV);

  // Invoice Modal Close
  document.getElementById('close-invoice-btn')?.addEventListener('click', () => {
    document.getElementById('invoice-modal').classList.remove('active');
  });

  // Product Edit Modal Listeners
  document.getElementById('close-product-modal-btn')?.addEventListener('click', closeProductEditModal);
  document.getElementById('cancel-product-edit-btn')?.addEventListener('click', closeProductEditModal);
  document.getElementById('product-edit-form')?.addEventListener('submit', handleProductEditSubmit);
}

// Fetch Main Data
async function loadDashboardData() {
  await Promise.all([
    fetchOrdersData(),
    fetchProductsData()
  ]);
}

async function fetchOrdersData() {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { 'x-admin-token': adminToken }
    });

    if (res.status === 401) {
      showToast('Session expirée. Veuillez vous reconnecter.', 'error');
      adminToken = null;
      localStorage.removeItem('admin_auth_token');
      showLogin();
      return;
    }

    const data = await res.json();
    if (data.success && data.orders) {
      allOrders = data.orders;
      updateKPIs();
      renderOrdersTable();
      renderRecentOrders();
      renderCRMTable();
      renderSalesChart();
      
      const now = new Date().toLocaleTimeString('fr-FR');
      document.getElementById('last-update-time').textContent = `Dernière mise à jour : ${now}`;
    }
  } catch (err) {
    console.error('Erreur chargement commandes:', err);
    showToast('Impossible de contacter l\'API sur le port 3000', 'error');
  }
}

async function fetchProductsData() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    if (data.success && data.products) {
      allProducts = data.products;
      renderProductsAdmin();
    }
  } catch (err) {
    console.error('Erreur catalogue:', err);
  }
}

// Update KPI Stats Header
function updateKPIs() {
  const totalRevenue = allOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);

  const pendingCount = allOrders.filter(o => o.status === 'paid' || o.status === 'pending').length;
  const shippedCount = allOrders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;

  document.getElementById('kpi-revenue').textContent = `${totalRevenue.toFixed(2)} €`;
  document.getElementById('kpi-orders-count').textContent = allOrders.length;
  document.getElementById('kpi-pending-ship').textContent = pendingCount;
  document.getElementById('kpi-shipped').textContent = shippedCount;

  // Filter count chips
  document.getElementById('cnt-all').textContent = allOrders.length;
  document.getElementById('cnt-paid').textContent = allOrders.filter(o => o.status === 'paid').length;
  document.getElementById('cnt-shipped').textContent = allOrders.filter(o => o.status === 'shipped').length;
  document.getElementById('cnt-delivered').textContent = allOrders.filter(o => o.status === 'delivered').length;
}

// Render Orders Table
function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  const searchQuery = document.getElementById('search-orders-input')?.value.toLowerCase().trim() || '';

  const filtered = allOrders.filter(o => {
    // Status filter
    if (currentOrderFilter !== 'all' && o.status !== currentOrderFilter) return false;
    
    // Search query
    if (searchQuery) {
      const matchId = o.orderId.toLowerCase().includes(searchQuery);
      const matchName = (o.customerInfo?.name || '').toLowerCase().includes(searchQuery);
      const matchEmail = (o.customerInfo?.email || '').toLowerCase().includes(searchQuery);
      return matchId || matchName || matchEmail;
    }
    return true;
  });

  if (filtered.length > 0) {
    tbody.innerHTML = filtered.map(o => `
      <tr>
        <td><strong style="color: var(--gold-primary);">${escapeHtml(o.orderId)}</strong></td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(o.customerInfo?.name || 'Client Privé')}</div>
          <div style="font-size: 0.78rem; color: var(--cream-muted);">${escapeHtml(o.customerInfo?.email || 'N/A')}</div>
        </td>
        <td style="font-size: 0.8rem; max-width: 200px; color: var(--cream-muted);">
          📍 ${escapeHtml(o.customerInfo?.address || 'Non renseignée')}
        </td>
        <td style="font-size: 0.8rem;">
          ${(o.items || []).map(i => `${escapeHtml(i.name)} (x${escapeHtml(i.quantity)})`).join('<br>')}
        </td>
        <td><strong style="color: var(--gold-glow); font-size: 0.95rem;">${escapeHtml(o.totalAmount)} €</strong></td>
        <td>
          <select class="status-select" id="status-${escapeHtml(o.orderId)}">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>En attente</option>
            <option value="paid" ${o.status === 'paid' ? 'selected' : ''}>Payée</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Expédiée</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Livrée</option>
          </select>
        </td>
        <td>
          <input type="text" class="tracking-input" id="tracking-${escapeHtml(o.orderId)}" value="${escapeHtml(o.trackingNumber || '')}" placeholder="Ex: 8U00123456">
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-primary" onclick="saveOrderDetails('${escapeHtml(o.orderId)}')" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" title="Enregistrer la mise à jour">
              💾
            </button>
            <button type="button" class="btn-secondary" onclick='openInvoice("${escapeHtml(o.orderId)}")' style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" title="Voir / Imprimer la facture">
              📄
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--cream-muted); padding: 2rem;">Aucune commande ne correspond aux critères.</td></tr>`;
  }
}

// Save Order Status and Tracking
async function saveOrderDetails(orderId) {
  const statusSelect = document.getElementById(`status-${orderId}`);
  const trackingInput = document.getElementById(`tracking-${orderId}`);

  const status = statusSelect ? statusSelect.value : 'paid';
  const trackingNumber = trackingInput ? trackingInput.value.trim() : '';

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken
      },
      body: JSON.stringify({ status, trackingNumber })
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error);

    showToast(`Statut mis à jour (${status}) ${trackingNumber ? '• Suivi: ' + trackingNumber : ''}`, 'success', `Commande ${orderId}`);
    await fetchOrdersData();
  } catch (err) {
    showToast(`Erreur de mise à jour : ${err.message}`, 'error', 'Échec Modification');
  }
}

// Render Recent Orders List in Overview
function renderRecentOrders() {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;

  const recent = allOrders.slice(0, 5);
  if (recent.length > 0) {
    container.innerHTML = recent.map(o => `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-gold); padding: 0.75rem 1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: var(--gold-primary); font-size: 0.88rem;">${escapeHtml(o.orderId)}</strong>
          <div style="font-size: 0.78rem; color: var(--cream-muted);">${escapeHtml(o.customerInfo?.name || 'Client')}</div>
        </div>
        <div style="text-align: right;">
          <strong style="color: var(--gold-glow); font-size: 0.92rem;">${escapeHtml(o.totalAmount)} €</strong>
          <span class="status-badge ${o.status === 'paid' ? 'status-paid' : 'status-pending'}" style="display: block; margin-top: 2px;">
            ${escapeHtml(o.status)}
          </span>
        </div>
      </div>
    `).join('');
  } else {
    container.innerHTML = `<div style="text-align: center; color: var(--cream-muted); padding: 1rem;">Aucune commande récente.</div>`;
  }
}

// Render CRM Customers Table
function renderCRMTable() {
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;

  // Deduplicate customers by email
  const customersMap = new Map();

  allOrders.forEach(o => {
    const email = o.customerInfo?.email?.toLowerCase().trim();
    if (!email) return;

    if (!customersMap.has(email)) {
      customersMap.set(email, {
        name: o.customerInfo?.name || 'Client Privé',
        email,
        address: o.customerInfo?.address || 'Non spécifiée',
        orderCount: 1,
        totalSpent: parseFloat(o.totalAmount || 0),
        firstOrderAt: o.createdAt
      });
    } else {
      const c = customersMap.get(email);
      c.orderCount += 1;
      c.totalSpent += parseFloat(o.totalAmount || 0);
    }
  });

  const customersList = Array.from(customersMap.values());

  if (customersList.length > 0) {
    tbody.innerHTML = customersList.map(c => `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td style="color: var(--gold-primary);">${escapeHtml(c.email)}</td>
        <td style="font-size: 0.82rem; color: var(--cream-muted);">📍 ${escapeHtml(c.address)}</td>
        <td><span class="filter-chip" style="padding: 2px 8px;">${c.orderCount} commande(s)</span></td>
        <td><strong style="color: var(--gold-glow);">${c.totalSpent.toFixed(2)} €</strong></td>
        <td style="font-size: 0.8rem; color: var(--cream-muted);">${new Date(c.firstOrderAt).toLocaleDateString('fr-FR')}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--cream-muted); padding: 2rem;">Aucun client dans la base.</td></tr>`;
  }
}

// Render Products List in Admin
function renderProductsAdmin() {
  const container = document.getElementById('products-admin-list');
  if (!container) return;

  container.innerHTML = allProducts.map(p => {
    const stock = typeof p.stockQuantity === 'number' ? p.stockQuantity : 100;
    let stockBadgeClass = 'status-paid';
    let stockBadgeText = `En Stock (${stock} unités)`;

    if (stock === 0) {
      stockBadgeClass = 'status-cancelled';
      stockBadgeText = '⚠️ Rupture de Stock (0)';
    } else if (stock <= 10) {
      stockBadgeClass = 'status-pending';
      stockBadgeText = `⚠️ Stock Faible (${stock})`;
    }

    return `
      <div class="prod-admin-card" style="display: flex; gap: 15px; align-items: center; background: rgba(28, 19, 13, 0.7); border: 1px solid var(--border-gold); padding: 1.2rem; border-radius: 16px; margin-bottom: 1rem;">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border-gold);">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h4 style="color: var(--gold-glow); font-size: 1.05rem; margin: 0;">${escapeHtml(p.name)}</h4>
            ${p.popular ? '<span style="font-size: 0.75rem; background: rgba(212,175,55,0.2); color: var(--gold-primary); padding: 2px 8px; border-radius: 20px; border: 1px solid var(--gold-primary); font-weight: 600;">⭐ Star</span>' : ''}
          </div>
          <div style="font-size: 0.82rem; color: var(--gold-primary); margin: 3px 0;">${escapeHtml(p.subtitle || '')}</div>
          <div style="font-size: 0.82rem; color: var(--cream-muted);">${escapeHtml(p.spec1Label || 'Spécification')}: ${escapeHtml(p.spec1Value || 'N/A')} • ${escapeHtml(p.spec2Label || '')}: ${escapeHtml(p.spec2Value || '')}</div>
          <div style="font-size: 0.78rem; color: var(--cream-soft); margin-top: 4px; max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.description || '')}</div>
        </div>

        <div style="text-align: right; min-width: 170px;">
          <strong style="font-size: 1.25rem; color: var(--gold-glow); display: block;">${Number(p.price || 0).toFixed(2)} €</strong>
          <span class="status-badge ${stockBadgeClass}" style="margin: 6px 0; display: inline-block;">${stockBadgeText}</span>
          <br>
          <button type="button" class="btn-secondary" onclick="openProductEditModal('${escapeHtml(p.id)}')" style="padding: 0.45rem 0.9rem; font-size: 0.82rem; margin-top: 6px; border-radius: 8px; cursor: pointer;">
            ✏️ Modifier Produit & Stock
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Open Product Edit Modal
function openProductEditModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return showToast('Produit introuvable', 'error');

  document.getElementById('edit-prod-id').value = product.id;
  document.getElementById('edit-prod-name').value = product.name || '';
  document.getElementById('edit-prod-subtitle').value = product.subtitle || '';
  document.getElementById('edit-prod-stock').value = typeof product.stockQuantity === 'number' ? product.stockQuantity : 100;
  document.getElementById('edit-prod-price').value = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;
  document.getElementById('edit-prod-humidity').value = product.humidity || '';
  document.getElementById('edit-prod-vanillin').value = product.vanillin || '';
  document.getElementById('edit-prod-desc').value = product.description || '';
  document.getElementById('edit-prod-popular').checked = !!product.popular;

  document.getElementById('product-edit-modal').classList.add('active');
}

// Close Product Edit Modal
function closeProductEditModal() {
  document.getElementById('product-edit-modal').classList.remove('active');
}

// Handle Product Edit Form Submission
async function handleProductEditSubmit(e) {
  e.preventDefault();
  const productId = document.getElementById('edit-prod-id').value;
  if (!productId) return;

  const payload = {
    name: document.getElementById('edit-prod-name').value,
    subtitle: document.getElementById('edit-prod-subtitle').value,
    stockQuantity: parseInt(document.getElementById('edit-prod-stock').value, 10),
    price: parseFloat(document.getElementById('edit-prod-price').value),
    humidity: document.getElementById('edit-prod-humidity').value,
    vanillin: document.getElementById('edit-prod-vanillin').value,
    description: document.getElementById('edit-prod-desc').value,
    isPopular: document.getElementById('edit-prod-popular').checked
  };

  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`Produit "${data.product.name}" mis à jour avec succès (Stock: ${data.product.stockQuantity})`, 'success', 'Stock & Catalogue');
      
      // Update local array & re-render
      const index = allProducts.findIndex(p => p.id === productId);
      if (index !== -1) {
        allProducts[index] = data.product;
      }
      renderProductsAdmin();
      closeProductEditModal();
    } else {
      showToast(data.error || 'Erreur lors de la mise à jour du produit', 'error');
    }
  } catch (err) {
    console.error('Erreur update product:', err);
    showToast('Impossible de joindre le serveur API pour enregistrer les modifications', 'error');
  }
}

// Render Sales Chart using Chart.js
function renderSalesChart() {
  const ctx = document.getElementById('salesChart')?.getContext('2d');
  if (!ctx) return;

  // Aggregate sales by product name
  const salesMap = {};
  allOrders.forEach(o => {
    (o.items || []).forEach(item => {
      salesMap[item.name] = (salesMap[item.name] || 0) + item.quantity;
    });
  });

  const labels = Object.keys(salesMap);
  const data = Object.values(salesMap);

  if (salesChartInstance) salesChartInstance.destroy();

  salesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Aucune vente'],
      datasets: [{
        label: 'Quantité de gousses / tubes vendus',
        data: data.length > 0 ? data : [0],
        backgroundColor: 'rgba(212, 175, 55, 0.6)',
        borderColor: '#d4af37',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#f9f6f0' } }
      },
      scales: {
        x: { ticks: { color: '#d1c5b4' }, grid: { display: false } },
        y: { ticks: { color: '#d1c5b4' }, grid: { color: 'rgba(212,175,55,0.1)' } }
      }
    }
  });
}

// Printable Invoice Modal Open
function openInvoice(orderId) {
  const order = allOrders.find(o => o.orderId === orderId);
  if (!order) return;

  const container = document.getElementById('invoice-printable-area');
  if (!container) return;

  const itemsHtml = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 0; color: #333;">${escapeHtml(item.name)}</td>
      <td style="padding: 10px 0; text-align: center; color: #555;">x${escapeHtml(item.quantity)}</td>
      <td style="padding: 10px 0; text-align: right; color: #333;">${Number(item.unitPrice || 0).toFixed(2)} €</td>
      <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #111;">${(Number(item.unitPrice || 0) * Number(item.quantity || 1)).toFixed(2)} €</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="font-family: inherit; color: #222; line-height: 1.5;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #d4af37; padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h2 style="color: #120c09; margin: 0; font-size: 1.6rem;">✦ LUMEN</h2>
          <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">Lumen Atelier SAS</div>
          <div style="font-size: 0.78rem; color: #777;">SIRET : 912 345 678 00014 • TVA : FR 32 912345678</div>
        </div>
        <div style="text-align: right;">
          <h3 style="color: #d4af37; margin: 0; font-size: 1.3rem;">FACTURE CLIENT</h3>
          <div style="font-size: 0.9rem; font-weight: 700; color: #111; margin-top: 4px;">N° ${escapeHtml(order.orderId)}</div>
          <div style="font-size: 0.8rem; color: #666;">Date : ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
        </div>
      </div>

      <div style="background: #fdfbf7; border: 1px solid #f0e6d2; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h4 style="margin: 0 0 6px 0; font-size: 0.9rem; color: #785a18;">ADRESSE DE LIVRAISON</h4>
        <div style="font-size: 0.9rem; font-weight: 700;">${escapeHtml(order.customerInfo?.name || 'Client')}</div>
        <div style="font-size: 0.85rem; color: #444;">${escapeHtml(order.customerInfo?.email || '')}</div>
        <div style="font-size: 0.85rem; color: #555; margin-top: 4px;">📍 ${escapeHtml(order.customerInfo?.address || '')}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9rem;">
        <thead>
          <tr style="border-bottom: 2px solid #111; text-align: left; font-size: 0.8rem; color: #666;">
            <th style="padding-bottom: 8px;">PRODUIT</th>
            <th style="padding-bottom: 8px; text-align: center;">QTÉ</th>
            <th style="padding-bottom: 8px; text-align: right;">P.U TTC</th>
            <th style="padding-bottom: 8px; text-align: right;">TOTAL TTC</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 240px; font-size: 0.9rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #666;">
            <span>Livraison Colissimo :</span>
            <span>${parseFloat(order.totalAmount) > 50 ? 'GRATUIT' : '4,90 €'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 2px solid #d4af37; padding-top: 8px; font-size: 1.15rem; font-weight: 800; color: #120c09;">
            <span>TOTAL REGLE :</span>
            <span>${escapeHtml(order.totalAmount)} €</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('invoice-modal').classList.add('active');
}

// CSV Exporters
function exportOrdersCSV() {
  if (allOrders.length === 0) return showToast('Aucune commande à exporter', 'error');

  const headers = ['Ref Commande', 'Date', 'Nom Client', 'Email Client', 'Adresse Livraison', 'Montant EUR', 'Statut', 'Suivi Colissimo'];
  const rows = allOrders.map(o => [
    o.orderId,
    new Date(o.createdAt).toISOString(),
    `"${(o.customerInfo?.name || '').replace(/"/g, '""')}"`,
    `"${(o.customerInfo?.email || '').replace(/"/g, '""')}"`,
    `"${(o.customerInfo?.address || '').replace(/"/g, '""')}"`,
    o.totalAmount,
    o.status,
    o.trackingNumber || ''
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `lumen_commandes_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Téléchargement du fichier CSV des commandes terminé', 'success', 'Export Comptable');
}

function exportCustomersCSV() {
  const customersMap = new Map();
  allOrders.forEach(o => {
    const email = o.customerInfo?.email?.toLowerCase().trim();
    if (!email) return;
    if (!customersMap.has(email)) {
      customersMap.set(email, {
        name: o.customerInfo?.name || '',
        email,
        address: o.customerInfo?.address || '',
        orderCount: 1,
        totalSpent: parseFloat(o.totalAmount || 0)
      });
    } else {
      const c = customersMap.get(email);
      c.orderCount += 1;
      c.totalSpent += parseFloat(o.totalAmount || 0);
    }
  });

  const headers = ['Nom Client', 'Email', 'Adresse Livraison', 'Nb Commandes', 'Total Depense EUR'];
  const rows = Array.from(customersMap.values()).map(c => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.email.replace(/"/g, '""')}"`,
    `"${c.address.replace(/"/g, '""')}"`,
    c.orderCount,
    c.totalSpent.toFixed(2)
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `lumen_clients_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Téléchargement du fichier CSV des clients CRM terminé', 'success', 'Export CRM');
}
