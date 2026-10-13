/**
 * ILAMPIRAI KITCHENS — ADMIN BUSINESS MANAGER SCRIPT
 * Implements sidebar sections: Orders, Products, Users, Subcategories, Shipping, Blogs, Inventory Alerts, Best Sellers
 */

// Admin Toast Notification (non-blocking feedback)
function showAdminToast(message, type = 'success') {
  let toast = document.getElementById('adminToastNotif');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToastNotif';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      padding: 14px 22px; border-radius: 10px; font-size: 14px; font-weight: 600;
      color: #fff; box-shadow: 0 6px 24px rgba(0,0,0,0.18);
      transition: opacity 0.35s ease, transform 0.35s ease;
      max-width: 380px; line-height: 1.5;
    `;
    document.body.appendChild(toast);
  }
  toast.style.background = type === 'error' ? '#ef4444' : '#059669';
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
  }, 3200);
}

document.addEventListener('DOMContentLoaded', async () => {
  checkAdminAuth();
  setupSidebarNavigation();
  await loadAdminData();
  renderOrdersTable();
  renderProductsTable();
  initDefaultProductVariants();
  renderInventoryAlerts();
  renderBestSellers();
  renderUsersList();
  renderCategoriesTable();
  renderSubcategories();
  renderShippingSettings();
  renderCouponsTable();
  renderBlogsList();
});

// Admin Authentication State & Helpers
function checkAdminAuth() {
  const isLoggedIn = localStorage.getItem('ik_admin_logged_in') === 'true';
  const loginScreen = document.getElementById('adminLoginScreen');
  const appShell = document.getElementById('adminAppShell');

  if (!isLoggedIn) {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appShell) appShell.style.display = 'none';
  } else {
    if (loginScreen) loginScreen.style.display = 'none';
    if (appShell) appShell.style.display = 'flex';
  }
}

function handleAdminLogin(event) {
  event.preventDefault();
  const user = document.getElementById('adminLoginUser').value.trim();
  const pass = document.getElementById('adminLoginPass').value.trim();
  const errBox = document.getElementById('loginErrorMessage');

  if ((user === 'admin@ilampirai.com' || user === 'admin') && pass === 'admin123') {
    localStorage.setItem('ik_admin_logged_in', 'true');
    if (errBox) errBox.style.display = 'none';
    checkAdminAuth();
    loadAdminData();
  } else {
    if (errBox) {
      errBox.textContent = 'Invalid credentials. Please use demo login: admin@ilampirai.com / admin123';
      errBox.style.display = 'block';
    } else {
      alert('Invalid admin credentials. Use admin@ilampirai.com / admin123');
    }
  }
}

function handleAdminLogout(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('ik_admin_logged_in');
  checkAdminAuth();
}

// Admin State
const AdminState = {
  activeTab: 'orders',
  orders: [],
  products: [],
  categories: [],
  users: [
    { id: 'usr-1', name: 'Kavitha Ramachandran', email: 'kavitha.r@example.com', phone: '+91 98401 23456', city: 'Chennai', totalOrders: 4, spent: '₹2,450' },
    { id: 'usr-2', name: 'Arun Kumar Sundaram', email: 'arun.sundar@example.com', phone: '+91 94432 78901', city: 'Coimbatore', totalOrders: 2, spent: '₹1,280' },
    { id: 'usr-3', name: 'Divya Narayanan', email: 'divya.n@example.com', phone: '+91 97890 54321', city: 'Bengaluru', totalOrders: 1, spent: '₹1,899' },
    { id: 'usr-4', name: 'Suresh Balasubramanian', email: 'suresh.bala@example.com', phone: '+91 98840 98765', city: 'Madurai', totalOrders: 3, spent: '₹1,740' }
  ],
  subcategories: [
    { id: 'sub-1', name: 'Daily Sambar & Rasam Powders', parent: 'Spices & Masalas', slug: 'sambar-rasam-powders', icon: '🍲', status: 'Active', description: 'Freshly roasted traditional spice mixes for everyday sambar & rasam.', itemCount: 6 },
    { id: 'sub-2', name: 'Traditional Tiffin Podis', parent: 'Traditional Podis', slug: 'tiffin-podis', icon: '🍚', status: 'Active', description: 'Gunpowder, Paruppu, Idli & Dosa accompaniments.', itemCount: 8 },
    { id: 'sub-3', name: 'Grandma Style Cured Pickles', parent: 'South Indian Pickles', slug: 'grandma-pickles', icon: '🥭', status: 'Active', description: 'Sun-dried and wood-pressed gingelly oil cured South Indian pickles.', itemCount: 5 },
    { id: 'sub-4', name: 'Multi-in-1 Festival Combo Packs', parent: 'Kitchen Combos', slug: 'festival-combos', icon: '🎁', status: 'Active', description: 'Curated 1-in-1 to 10-in-1 combo gift boxes.', itemCount: 10 },
    { id: 'sub-5', name: 'Stone Ground Non-Veg Masalas', parent: 'Spices & Masalas', slug: 'non-veg-masalas', icon: '🍗', status: 'Active', description: 'Chettinad pepper chicken, mutton and fish curries.', itemCount: 4 }
  ],
  shippingZones: [
    { id: 'zone-1', state: 'Tamil Nadu', zone: 'Tamil Nadu', amount: 40, rate: '₹40', status: 'Active' },
    { id: 'zone-2', state: 'Puducherry', zone: 'Puducherry', amount: 40, rate: '₹40', status: 'Active' },
    { id: 'zone-3', state: 'Karnataka', zone: 'Karnataka', amount: 50, rate: '₹50', status: 'Active' },
    { id: 'zone-4', state: 'Kerala', zone: 'Kerala', amount: 50, rate: '₹50', status: 'Active' },
    { id: 'zone-5', state: 'Andhra Pradesh', zone: 'Andhra Pradesh', amount: 50, rate: '₹50', status: 'Active' },
    { id: 'zone-6', state: 'Telangana', zone: 'Telangana', amount: 50, rate: '₹50', status: 'Active' },
    { id: 'zone-7', state: 'Maharashtra', zone: 'Maharashtra', amount: 70, rate: '₹70', status: 'Active' },
    { id: 'zone-8', state: 'Delhi', zone: 'Delhi', amount: 70, rate: '₹70', status: 'Active' },
    { id: 'zone-9', state: 'Special Remote & Hill Regions', zone: 'Special Remote & Hill Regions', amount: 120, rate: '₹120', status: 'Active' }
  ],
  coupons: [],
  blogs: [
    { title: 'The Secret to Golden Sambar: 18 Roasted Spices', author: 'Chef Ilampirai', date: 'Oct 05, 2026', views: 820 },
    { title: 'Why Wood-Pressed Gingelly Oil Makes Pickles Last Years', author: 'Kitchen Team', date: 'Sep 28, 2026', views: 1140 },
    { title: '5 South Indian Podis Every Busy Household Needs', author: 'Ananya S.', date: 'Sep 15, 2026', views: 950 }
  ]
};

async function loadAdminData() {
  AdminState.orders = await Api.getOrders();
  AdminState.products = await Api.getProducts();
  AdminState.categories = await Api.getCategories();
  AdminState.subcategories = await Api.getSubcategories();
  AdminState.shippingZones = await Api.getShippingZones();
  AdminState.coupons = await Api.getCoupons();
  AdminState.blogs = await Api.getBlogs();
  updateStatCards();
  renderCategoriesTable();
  syncCategoryDropdowns();
  syncSubcategoriesDropdownForProduct();
}

// Sidebar Tab Switcher
function setupSidebarNavigation() {
  const items = document.querySelectorAll('.sidebar-item[data-tab]');
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = item.getAttribute('data-tab');
      switchAdminTab(tabName);
    });
  });
}

function switchAdminTab(tabName) {
  AdminState.activeTab = tabName;

  // Update active sidebar item
  document.querySelectorAll('.sidebar-item[data-tab]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
  });

  // Switch visible tab panel
  document.querySelectorAll('.admin-tab-content').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });

  // Update header title
  const titleMap = {
    'orders': 'Orders Management',
    'products': 'Product Catalog & Pricing',
    'categories': 'Categories & Taxonomies',
    'users': 'Customer Database',
    'subcategories': 'Subcategories & Taxonomies',
    'shipping': 'Shipping Zones & Logistics',
    'coupons': 'Promotional Coupons & Discounts',
    'blogs': 'Culinary Blogs & Recipes',
    'inventory': 'Inventory Alerts & Stock Warning',
    'bestsellers': 'Best Sellers & Stock Analytics'
  };

  const pageTitle = document.getElementById('adminPageTitle');
  if (pageTitle) pageTitle.textContent = titleMap[tabName] || 'Admin Dashboard';
}

function updateStatCards() {
  const totalRev = AdminState.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrders = AdminState.orders.length;
  const lowStockCount = AdminState.products.filter(p => (p.stock || 0) < 20).length;

  const statSales = document.getElementById('adminTotalSales');
  const statOrders = document.getElementById('adminTotalOrders');
  const statProducts = document.getElementById('adminTotalProducts');
  const statAlerts = document.getElementById('adminTotalAlerts');

  if (statSales) statSales.textContent = `₹${totalRev.toLocaleString('en-IN')}`;
  if (statOrders) statOrders.textContent = totalOrders;
  if (statProducts) statProducts.textContent = AdminState.products.length;
  if (statAlerts) statAlerts.textContent = lowStockCount;
}

// 1. ORDERS TABLE & FULFILLMENT / SHIPMENT MANAGEMENT
function renderOrdersTable() {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  if (AdminState.orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px;">No orders recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = AdminState.orders.map(order => {
    const trk = order.tracking || null;
    const hasTracking = trk && (trk.trackingNumber || trk.carrier);

    return `
      <tr>
        <td><strong>${order.id}</strong></td>
        <td>${order.date || '2026-10-12'}</td>
        <td>
          <div><strong>${order.customer?.name || 'Customer'}</strong></div>
          <div style="font-size: 12px; color: var(--admin-muted);">${order.customer?.phone || ''}</div>
          <div style="font-size: 11px; color: var(--admin-muted);">${order.customer?.email || ''}</div>
        </td>
        <td>${order.items?.map(i => `${i.qty}× ${i.name} (${i.weight})`).join('<br>') || 'Combo items'}</td>
        <td><strong>₹${order.totalAmount}</strong></td>
        <td>
          <!-- Fulfillment Status & Shipment Tracking Box -->
          <div style="display: flex; flex-direction: column; gap: 6px; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <select onchange="handleOrderStatusChange('${order.id}', this.value)" style="padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; flex: 1;">
                <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>📦 Processing</option>
                <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>🚚 Shipped</option>
                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
              </select>
            </div>

            <!-- Shipment Tracking Details Box (Admin Only editable) -->
            ${hasTracking ? `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 8px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                  <strong style="color: #166534; font-size: 11px;">🚚 ${trk.carrier || 'Logistics Partner'}</strong>
                  <div style="display: flex; gap: 4px;">
                    <button type="button" onclick="openShipmentModal('${order.id}')" title="Edit Shipment Details" style="border: none; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">✏️ Edit</button>
                    <button type="button" onclick="confirmDeleteShipment('${order.id}')" title="Delete Shipment Details" style="border: none; background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">🗑️</button>
                  </div>
                </div>
                <div style="font-family: monospace; font-weight: 700; color: #0f172a; word-break: break-all;">
                  AWB: ${trk.trackingNumber || 'N/A'}
                </div>
                ${trk.trackingUrl ? `
                  <a href="${trk.trackingUrl}" target="_blank" style="font-size: 11px; color: #0284c7; text-decoration: underline; display: inline-block; margin-top: 2px;">Track Link ↗</a>
                ` : ''}
              </div>
            ` : `
              <div style="display: flex; align-items: center; gap: 6px;">
                <button type="button" onclick="openShipmentModal('${order.id}')" class="btn-admin" style="background: #ecfdf5; border: 1px dashed #10b981; color: #047857; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer; width: 100%; text-align: left; display: flex; align-items: center; justify-content: space-between;">
                  <span>➕ Add Shipping & Tracking</span>
                  <span>🚚</span>
                </button>
              </div>
            `}
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button class="btn-admin btn-admin-outline" style="padding: 4px 10px; font-size: 12px;" onclick="viewOrderReceipt('${order.id}')">
              👁️ View Receipt
            </button>
            <button class="btn-admin btn-admin-outline" style="padding: 4px 10px; font-size: 12px; background: #f8fafc;" onclick="openShipmentModal('${order.id}')">
              🚚 Shipment Info
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

let currentModalOrderId = null;
let currentShipmentOrderId = null;

async function handleOrderStatusChange(orderId, newStatus) {
  // If changed to Shipped and no tracking details yet, prompt admin to enter shipment info
  const ord = AdminState.orders.find(o => o.id === orderId);
  await Api.updateOrderStatus(orderId, newStatus);
  if (ord) ord.status = newStatus;
  renderOrdersTable();

  if (newStatus === 'Shipped' && (!ord.tracking || !ord.tracking.trackingNumber)) {
    openShipmentModal(orderId);
  }
}

// Shipment Details Modal (Create, Edit, Update, Delete)
function openShipmentModal(orderId) {
  currentShipmentOrderId = orderId;
  const ord = AdminState.orders.find(o => o.id === orderId);
  if (!ord) return;

  const modal = document.getElementById('adminShipmentModal');
  const orderIdSpan = document.getElementById('shipmentModalOrderId');
  const customerSpan = document.getElementById('shipmentModalCustomer');
  const numberInput = document.getElementById('shipmentTrackingNumber');
  const carrierInput = document.getElementById('shipmentCarrier');
  const urlInput = document.getElementById('shipmentTrackingUrl');
  const notesInput = document.getElementById('shipmentNotes');
  const deleteBtn = document.getElementById('shipmentDeleteBtn');

  if (orderIdSpan) orderIdSpan.textContent = `#${ord.id}`;
  if (customerSpan) customerSpan.textContent = `${ord.customer?.name || 'Customer'} (${ord.customer?.city || ''}, ${ord.customer?.state || ''})`;

  const trk = ord.tracking || {};
  if (numberInput) numberInput.value = trk.trackingNumber || '';
  if (carrierInput) carrierInput.value = trk.carrier || 'Delhivery Express';
  if (urlInput) urlInput.value = trk.trackingUrl || '';
  if (notesInput) notesInput.value = trk.notes || '';

  // Show or hide delete button based on whether tracking info exists
  if (deleteBtn) {
    deleteBtn.style.display = (trk.trackingNumber || trk.carrier) ? 'inline-block' : 'none';
  }

  if (modal) modal.classList.add('active');
}

function closeShipmentModal() {
  const modal = document.getElementById('adminShipmentModal');
  if (modal) modal.classList.remove('active');
  currentShipmentOrderId = null;
}

async function handleSaveShipmentDetails(event) {
  if (event) event.preventDefault();
  if (!currentShipmentOrderId) return;

  const orderId = currentShipmentOrderId;
  const trackingNumber = (document.getElementById('shipmentTrackingNumber')?.value || '').trim();
  const carrier = (document.getElementById('shipmentCarrier')?.value || '').trim();
  const trackingUrl = (document.getElementById('shipmentTrackingUrl')?.value || '').trim();
  const notes = (document.getElementById('shipmentNotes')?.value || '').trim();

  if (!trackingNumber) {
    alert('Please enter a tracking number / AWB.');
    return;
  }

  const trackingPayload = {
    trackingNumber,
    carrier: carrier || 'Standard Logistics',
    trackingUrl: trackingUrl || (carrier.toLowerCase().includes('delhivery') ? `https://www.delhivery.com/track/package/${trackingNumber}` : ''),
    notes,
    shippedDate: new Date().toISOString(),
    estimatedDelivery: 'Within 3-5 Business Days',
    updatedAt: new Date().toISOString()
  };

  await Api.updateOrderTracking(orderId, trackingPayload);

  // Update in local AdminState
  const ord = AdminState.orders.find(o => o.id === orderId);
  if (ord) {
    ord.tracking = trackingPayload;
    if (ord.status !== 'Delivered') ord.status = 'Shipped';
  }

  closeShipmentModal();
  renderOrdersTable();
}

function confirmDeleteShipment(orderId) {
  if (!confirm(`Are you sure you want to delete shipment tracking details for order #${orderId}? Customer tracking info will be cleared.`)) {
    return;
  }
  executeDeleteShipment(orderId);
}

async function executeDeleteShipment(orderId) {
  const targetId = orderId || currentShipmentOrderId;
  if (!targetId) return;

  await Api.deleteOrderTracking(targetId);

  const ord = AdminState.orders.find(o => o.id === targetId);
  if (ord) {
    delete ord.tracking;
    if (ord.status === 'Shipped') ord.status = 'Processing';
  }

  closeShipmentModal();
  renderOrdersTable();
}

function viewOrderReceipt(orderId) {
  const ord = AdminState.orders.find(o => o.id === orderId);
  if (!ord) return;

  currentModalOrderId = orderId;
  const modal = document.getElementById('adminOrderModal');
  const titleId = document.getElementById('modalOrderId');
  const body = document.getElementById('modalOrderBody');
  const statusSelect = document.getElementById('modalStatusSelect');

  if (titleId) titleId.textContent = `#${ord.id}`;
  if (statusSelect) statusSelect.value = ord.status || 'Pending';

  // Calculate items summary
  const subtotal = ord.subtotal || ord.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) || ord.totalAmount;
  const discount = ord.discount || 0;
  const delivery = ord.deliveryFee !== undefined ? ord.deliveryFee : (subtotal >= 499 ? 0 : 40);
  const total = ord.totalAmount || Math.max(0, subtotal - discount + delivery);

  if (body) {
    body.innerHTML = `
      <!-- Information Cards -->
      <div class="modal-info-grid">
        <div class="info-block">
          <div class="info-block-title">👤 Customer Information</div>
          <p><strong>Name:</strong> ${ord.customer?.name || 'Customer'}</p>
          <p><strong>Phone:</strong> <a href="tel:${ord.customer?.phone}" style="color: var(--admin-blue); text-decoration: none;">${ord.customer?.phone || 'N/A'}</a></p>
          <p><strong>Email:</strong> <a href="mailto:${ord.customer?.email}" style="color: var(--admin-blue); text-decoration: none;">${ord.customer?.email || 'N/A'}</a></p>
          <p style="margin-top: 6px;"><strong>Order Date:</strong> ${ord.date || '2026-10-12'} (${ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Today'})</p>
        </div>

        <div class="info-block">
          <div class="info-block-title">🚚 Shipping & Payment</div>
          <p><strong>Delivery Address:</strong></p>
          <p style="color: var(--admin-muted);">${ord.customer?.address || 'Address provided'}, ${ord.customer?.city || ''} - ${ord.customer?.pincode || ''}</p>
          <p style="color: var(--admin-muted);">${ord.customer?.state || 'Tamil Nadu'}</p>
          <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
            <span class="status-pill delivered">${ord.paymentStatus || 'PAID'}</span>
            <span style="font-size: 13px; font-weight: 600;">Method: ${ord.paymentMethod || 'UPI'}</span>
          </div>
          ${ord.tracking ? `
            <div style="margin-top: 10px; padding: 8px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 12px;">
              <div style="font-weight: 700; color: #166534; display: flex; justify-content: space-between;">
                <span>🚚 ${ord.tracking.carrier || 'Courier Partner'}</span>
                <a href="javascript:void(0)" onclick="closeAdminOrderModal(); openShipmentModal('${ord.id}')" style="color: #0284c7; text-decoration: underline;">Edit</a>
              </div>
              <div style="font-family: monospace; font-weight: 600; margin-top: 2px;">Tracking No: ${ord.tracking.trackingNumber}</div>
              ${ord.tracking.estimatedDelivery ? `<div style="color: #64748b; font-size: 11px; margin-top: 2px;">Est: ${ord.tracking.estimatedDelivery}</div>` : ''}
            </div>
          ` : `
            <div style="margin-top: 8px;">
              <button class="btn-admin btn-admin-outline" style="font-size: 11px; padding: 3px 8px; width: 100%; text-align: center;" onclick="closeAdminOrderModal(); openShipmentModal('${ord.id}')">
                ➕ Add Shipment / Tracking Details
              </button>
            </div>
          `}
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 8px; font-size: 14px; font-weight: 700;">📦 Ordered Items & Pack Sizes</div>
      <table class="admin-modal-table">
        <thead>
          <tr>
            <th>Item Details</th>
            <th>Pack Size</th>
            <th>Unit Price</th>
            <th>Qty</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(ord.items || []).map(item => `
            <tr>
              <td>
                <strong>${item.name}</strong>
              </td>
              <td><span class="badge badge-primary">${item.weight || 'Standard'}</span></td>
              <td>₹${item.price}</td>
              <td><strong>${item.qty}</strong></td>
              <td style="text-align: right; font-weight: 700;">₹${item.price * item.qty}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Order Financial Summary -->
      <div class="modal-summary-box">
        <div class="modal-summary-row">
          <span>Items Subtotal:</span>
          <strong>₹${subtotal}</strong>
        </div>
        ${discount > 0 ? `
          <div class="modal-summary-row">
            <span>Festive / Coupon Discount:</span>
            <strong style="color: var(--admin-green);">-₹${discount}</strong>
          </div>
        ` : ''}
        <div class="modal-summary-row">
          <span>Delivery / Shipping Fee:</span>
          <span>${delivery === 0 ? '<span class="badge badge-success">FREE</span>' : `₹${delivery}`}</span>
        </div>
        ${ord.shippingZone ? `
          <div class="modal-summary-row" style="font-size: 12px; color: var(--admin-muted);">
            <span>Matched Shipping Zone:</span>
            <span>📍 ${ord.shippingZone}</span>
          </div>
        ` : ''}
        <div class="modal-summary-row total">
          <span>Grand Total Paid:</span>
          <span style="color: var(--admin-blue);">₹${total}</span>
        </div>
      </div>
    `;
  }

  if (modal) modal.classList.add('active');
}

function closeAdminOrderModal() {
  const modal = document.getElementById('adminOrderModal');
  if (modal) modal.classList.remove('active');
}

async function handleModalStatusUpdate(newStatus) {
  if (!currentModalOrderId) return;
  await handleOrderStatusChange(currentModalOrderId, newStatus);
}


// ==========================================================================
// 2. PRODUCTS: IMAGE PICKER, DYNAMIC VARIANTS & EDIT MODE
// ==========================================================================

// Image File Selector & FileReader
function handleImageFileSelect(event, prefix) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.getElementById(`${prefix}ImageData`).value = dataUrl;
    document.getElementById(`${prefix}ImagePreview`).src = dataUrl;
    document.getElementById(`${prefix}ImageName`).textContent = file.name;
    document.getElementById(`${prefix}ImagePreviewWrapper`).style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function removeSelectedImage(prefix) {
  const fileInput = document.getElementById(`${prefix}ImageFile`);
  if (fileInput) fileInput.value = '';
  document.getElementById(`${prefix}ImageData`).value = '';
  document.getElementById(`${prefix}ImagePreview`).src = '';
  document.getElementById(`${prefix}ImagePreviewWrapper`).style.display = 'none';
}

// Dynamic Variants Builder
function initDefaultProductVariants() {
  const container = document.getElementById('newProdVariantsList');
  if (!container) return;
  container.innerHTML = '';
  addVariantRow('newProd', '50g', 55, 70, 50);
  addVariantRow('newProd', '100g', 105, 130, 40);
  addVariantRow('newProd', '200g', 200, 250, 30);
}

function addVariantRow(prefix, weight = '100g', price = 99, origPrice = 120, stock = 30) {
  const container = document.getElementById(`${prefix}VariantsList`);
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'variant-row';
  row.innerHTML = `
    <input type="text" class="v-weight" value="${weight}" placeholder="Pack size (e.g. 100g)" required>
    <input type="number" class="v-price" value="${price}" min="1" placeholder="Selling Price (₹)" required>
    <input type="number" class="v-orig-price" value="${origPrice}" min="1" placeholder="MRP Price (₹)">
    <input type="number" class="v-stock" value="${stock}" min="0" placeholder="Stock">
    <button type="button" class="btn-del-variant" onclick="removeVariantRow(this)" title="Delete variant">✕</button>
  `;
  container.appendChild(row);
}

function removeVariantRow(btn) {
  const container = btn.closest('.variants-list');
  if (container.children.length <= 1) {
    alert('At least one pack variant is required!');
    return;
  }
  btn.closest('.variant-row').remove();
}

// Active Products Catalog Table
function renderProductsTable() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  if (AdminState.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px;">No products in catalog.</td></tr>`;
    return;
  }

  tbody.innerHTML = AdminState.products.map(prod => {
    const thumbHtml = prod.image
      ? `<img src="${prod.image}" alt="${prod.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid var(--admin-border);">`
      : `<span style="font-size: 26px;">${prod.emoji || '🍱'}</span>`;

    return `
      <tr>
        <td style="width: 60px;">${thumbHtml}</td>
        <td>
          <strong>${prod.name}</strong>
          <div style="font-size: 12px; color: var(--admin-muted);">${prod.comboType || prod.categoryName}</div>
        </td>
        <td>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${(prod.weights || []).map(w => `
              <span class="badge badge-primary" style="font-size: 11px;">
                ${w.weight}: ₹${w.price} ${w.originalPrice ? `<span style="text-decoration: line-through; opacity: 0.7;">₹${w.originalPrice}</span>` : ''}
              </span>
            `).join('')}
          </div>
        </td>
        <td>
          <strong style="color: ${(prod.stock || 0) < 20 ? 'var(--admin-red)' : 'var(--admin-green)'};">
            ${prod.stock || 0} units
          </strong>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn-admin btn-admin-outline" style="padding: 5px 12px; font-size: 12px; margin-right: 6px;" onclick="editProduct('${prod.id}')">
            ✏️ Edit
          </button>
          <button class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 12px; color: var(--admin-red);" onclick="deleteProduct('${prod.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Edit Mode
function editProduct(productId) {
  const prod = AdminState.products.find(p => p.id === productId);
  if (!prod) return;

  switchAdminTab('products');

  // Set edit state
  document.getElementById('editingProductId').value = prod.id;
  document.getElementById('productFormTitle').innerHTML = `✏️ Edit Product: <span style="color: var(--admin-blue);">${prod.name}</span>`;
  document.getElementById('saveProductSubmitBtn').textContent = '💾 Update Product Changes';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';

  // Fill in fields
  document.getElementById('newProdName').value = prod.name;
  document.getElementById('newProdCategory').value = prod.category;
  syncSubcategoriesDropdownForProduct();
  if (prod.subcategory) {
    document.getElementById('newProdSubcategory').value = prod.subcategory;
  }
  document.getElementById('newProdComboType').value = prod.comboType || 'Special Combo';
  document.getElementById('newProdBadge').value = prod.badge || '';
  document.getElementById('newProdEmoji').value = prod.emoji || '🍱';
  document.getElementById('newProdStock').value = prod.stock || 50;
  document.getElementById('newProdDesc').value = prod.description || '';

  // Fill in Image
  if (prod.image) {
    document.getElementById('newProdImageData').value = prod.image;
    document.getElementById('newProdImagePreview').src = prod.image;
    document.getElementById('newProdImageName').textContent = 'Current Product Image';
    document.getElementById('newProdImagePreviewWrapper').style.display = 'flex';
  } else {
    removeSelectedImage('newProd');
  }

  // Fill in Variants
  const variantsList = document.getElementById('newProdVariantsList');
  if (variantsList) {
    variantsList.innerHTML = '';
    if (prod.weights && prod.weights.length > 0) {
      prod.weights.forEach(w => {
        addVariantRow('newProd', w.weight, w.price, w.originalPrice || (w.price + 30), w.stock || prod.stock);
      });
    } else {
      addVariantRow('newProd', '100g', 100, 130, prod.stock);
    }
  }

  // Smooth scroll to form
  document.getElementById('adminProductForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelProductEditMode() {
  document.getElementById('editingProductId').value = '';
  document.getElementById('productFormTitle').textContent = '➕ Add New Recipe / Combo Product';
  document.getElementById('saveProductSubmitBtn').textContent = '💾 Save Product to Catalog';
  document.getElementById('cancelEditBtn').style.display = 'none';

  document.getElementById('adminProductForm').reset();
  removeSelectedImage('newProd');
  syncSubcategoriesDropdownForProduct();
  initDefaultProductVariants();
}

// Add or Update Product Handler
async function handleAddProductForm(event) {
  event.preventDefault();

  const editingId = document.getElementById('editingProductId').value;
  const name = document.getElementById('newProdName').value.trim();
  const category = document.getElementById('newProdCategory').value;
  const subcategory = document.getElementById('newProdSubcategory') ? document.getElementById('newProdSubcategory').value : '';
  const comboType = document.getElementById('newProdComboType').value.trim() || 'Special Combo';
  const badge = document.getElementById('newProdBadge').value.trim();
  const emoji = document.getElementById('newProdEmoji').value.trim() || '🍱';
  const stock = parseInt(document.getElementById('newProdStock').value || 50);
  const desc = document.getElementById('newProdDesc').value.trim();
  const image = document.getElementById('newProdImageData').value;

  // Extract Variants
  const variantRows = document.querySelectorAll('#newProdVariantsList .variant-row');
  const weights = [];
  variantRows.forEach(row => {
    const weight = row.querySelector('.v-weight').value.trim();
    const price = parseFloat(row.querySelector('.v-price').value) || 0;
    const originalPrice = parseFloat(row.querySelector('.v-orig-price').value) || (price + 25);
    const vStock = parseInt(row.querySelector('.v-stock').value) || stock;
    if (weight && price > 0) {
      weights.push({
        weight,
        price,
        originalPrice,
        cost: Math.round(price * 0.5),
        stock: vStock
      });
    }
  });

  if (weights.length === 0) {
    alert('Please define at least one valid pack variant (weight & price).');
    return;
  }

  const categoryNameMap = {
    'combos': 'Kitchen Combos',
    'spices': 'Spices & Masalas',
    'podis': 'Traditional Podis',
    'pickles': 'South Indian Pickles'
  };

  const productData = {
    id: editingId || ('prod-' + Date.now()),
    name,
    category,
    categoryName: categoryNameMap[category] || 'Kitchen Delicacy',
    subcategory: subcategory || undefined,
    comboType,
    badge,
    emoji,
    image: image || null,
    weights,
    rating: 5.0,
    reviewsCount: 1,
    description: desc,
    stock,
    isBestseller: badge.toLowerCase().includes('bestseller')
  };

  await Api.saveProduct(productData);

  // Update in memory state
  if (editingId) {
    const idx = AdminState.products.findIndex(p => p.id === editingId);
    if (idx >= 0) AdminState.products[idx] = productData;
    alert(`Product "${name}" updated successfully!`);
  } else {
    AdminState.products.unshift(productData);
    alert(`Product "${name}" added to catalog with ${weights.length} variants!`);
  }

  renderProductsTable();
  renderInventoryAlerts();
  renderBestSellers();
  updateStatCards();
  cancelProductEditMode();
}

// Universal In-App Modal Delete System
let pendingDeleteCallback = null;

function showDeleteModal({ title, message, onConfirm }) {
  const modal = document.getElementById('deleteConfirmModal');
  const titleEl = document.getElementById('deleteModalTitle');
  const msgEl = document.getElementById('deleteConfirmMessage');

  if (titleEl) titleEl.textContent = title || '🗑️ Confirm Deletion';
  if (msgEl) msgEl.innerHTML = message || 'Are you sure you want to permanently delete this item?';
  pendingDeleteCallback = onConfirm;

  if (modal) modal.classList.add('active');
}

function closeDeleteConfirmModal() {
  pendingDeleteCallback = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.remove('active');
}

async function executeDeleteAction() {
  const cb = pendingDeleteCallback;
  closeDeleteConfirmModal();
  if (typeof cb === 'function') {
    await cb();
  }
}

function deleteProduct(productId) {
  const prod = AdminState.products.find(p => p.id === productId);
  const name = prod ? prod.name : 'this product';

  showDeleteModal({
    title: '🗑️ Delete Product',
    message: `Are you sure you want to permanently delete the recipe product <strong>"${name}"</strong> from your active catalog?`,
    onConfirm: async () => {
      await Api.deleteProduct(productId);
      AdminState.products = AdminState.products.filter(p => p.id !== productId);
      renderProductsTable();
      renderInventoryAlerts();
      renderBestSellers();
      updateStatCards();
    }
  });
}


// 3. INVENTORY ALERTS
function renderInventoryAlerts() {
  const container = document.getElementById('inventoryAlertsList');
  if (!container) return;

  const lowStock = AdminState.products.filter(p => (p.stock || 0) <= 25);
  container.innerHTML = lowStock.map(p => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--admin-border); background: ${p.stock <= 15 ? '#fff5f5' : '#fff'};">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 26px;">${p.emoji}</span>
        <div>
          <strong>${p.name}</strong>
          <div style="font-size: 13px; color: var(--admin-muted);">${p.comboType} &middot; Restock Recommended</div>
        </div>
      </div>
      <div>
        <span class="status-pill ${p.stock <= 15 ? 'cancelled' : 'pending'}">${p.stock} units remaining</span>
        <button class="btn-admin btn-admin-primary" style="margin-left: 12px; padding: 6px 12px; font-size: 12px;" onclick="restockProduct('${p.id}')">
          ➕ Restock +50
        </button>
      </div>
    </div>
  `).join('');
}

async function restockProduct(productId) {
  const prod = AdminState.products.find(p => p.id === productId);
  if (!prod) return;
  prod.stock = (prod.stock || 0) + 50;
  await Api.saveProduct(prod);
  renderInventoryAlerts();
  renderProductsTable();
  updateStatCards();
  alert(`Added 50 units to stock for ${prod.name}`);
}

// 4. BEST SELLERS & STOCK
function renderBestSellers() {
  const container = document.getElementById('bestSellersTableBody');
  if (!container) return;

  const bestSellers = AdminState.products.filter(p => p.isBestseller);
  container.innerHTML = bestSellers.map(p => `
    <tr>
      <td><span style="font-size: 24px;">${p.emoji}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.comboType}</td>
      <td>★ ${p.rating} (${p.reviewsCount} reviews)</td>
      <td><span class="badge badge-success">High Demand</span></td>
      <td><strong>${p.stock} in stock</strong></td>
    </tr>
  `).join('');
}

// 5. USERS LIST
function renderUsersList() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = AdminState.users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td>${u.city}</td>
      <td><strong>${u.totalOrders}</strong></td>
      <td><strong>${u.spent}</strong></td>
    </tr>
  `).join('');
}

// ==========================================================================
// 6. CATEGORIES MANAGEMENT (CRUD: CREATE, EDIT, UPDATE, DELETE)
// ==========================================================================
function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  const rows = (AdminState.categories || []).map((cat, index) => {
    if (!cat.id || cat.id === 'undefined') {
      cat.id = 'cat-' + (index + 1) + '-' + (cat.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    const isInactive = cat.status === 'Inactive';
    const statusBg = isInactive ? 'var(--admin-red-light)' : 'var(--admin-green-light)';
    const statusColor = isInactive ? 'var(--admin-red)' : 'var(--admin-green)';
    const slug = cat.slug || (cat.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Count how many subcategories belong to this category
    const subCount = (AdminState.subcategories || []).filter(s =>
      s.parent && s.parent.toLowerCase() === (cat.name || '').toLowerCase()
    ).length;

    return `
      <tr>
        <td style="font-size: 24px; text-align: center;">${cat.icon || '📂'}</td>
        <td>
          <strong style="color: #0f172a; font-size: 14px;">${cat.name}</strong>
        </td>
        <td>
          <code style="font-size: 11px; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; color: #475569;">${slug}</code>
        </td>
        <td>
          <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${statusBg}; color: ${statusColor};">
            ${cat.status || 'Active'}
          </span>
        </td>
        <td>
          <span class="badge badge-primary" style="font-size: 12px; padding: 4px 8px;">
            ${subCount} Subcategories
          </span>
        </td>
        <td>
          <div style="font-size: 12px; color: var(--admin-muted); max-width: 250px;">${cat.description || '—'}</div>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 12px; font-size: 12px; margin-right: 6px;" onclick="editCategory('${cat.id}')">
            ✏️ Edit
          </button>
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 12px; color: var(--admin-red);" onclick="deleteCategory('${cat.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows.length ? rows : `<tr><td colspan="7" style="text-align: center; color: var(--admin-muted); padding: 32px;">No parent categories found. Click "+ New Category" above to create one!</td></tr>`;
}

function autoGenerateCategorySlug(val) {
  const editingId = document.getElementById('editingCategoryId').value;
  const slugInput = document.getElementById('catSlug');
  if (!editingId && slugInput) {
    slugInput.value = (val || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}

function startNewCategoryMode() {
  document.getElementById('editingCategoryId').value = '';
  document.getElementById('categoryFormTitle').innerHTML = '➕ Add New Category';
  document.getElementById('saveCatSubmitBtn').textContent = '💾 Save Category';
  document.getElementById('cancelCatEditBtn').style.display = 'none';

  document.getElementById('adminCategoryForm').reset();
  document.getElementById('catIcon').value = '🍱';
  document.getElementById('catStatus').value = 'Active';

  const panel = document.getElementById('categoryFormPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  const input = document.getElementById('catName');
  if (input) input.focus();
}

function editCategory(categoryId) {
  const cat = (AdminState.categories || []).find(c => c.id === categoryId);
  if (!cat) return;

  switchAdminTab('categories');

  document.getElementById('editingCategoryId').value = cat.id;
  document.getElementById('categoryFormTitle').innerHTML = `✏️ Edit Category: <span style="color: var(--admin-blue);">${cat.name}</span>`;
  document.getElementById('saveCatSubmitBtn').textContent = '💾 Update Category Changes';
  document.getElementById('cancelCatEditBtn').style.display = 'inline-flex';

  document.getElementById('catName').value = cat.name || '';
  document.getElementById('catSlug').value = cat.slug || '';
  document.getElementById('catIcon').value = cat.icon || '🍱';
  document.getElementById('catStatus').value = cat.status || 'Active';
  document.getElementById('catDesc').value = cat.description || '';

  const panel = document.getElementById('categoryFormPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  const input = document.getElementById('catName');
  if (input) input.focus();
}

function cancelCategoryEditMode() {
  document.getElementById('editingCategoryId').value = '';
  document.getElementById('categoryFormTitle').innerHTML = '➕ Add New Category';
  document.getElementById('saveCatSubmitBtn').textContent = '💾 Save Category';
  document.getElementById('cancelCatEditBtn').style.display = 'none';

  document.getElementById('adminCategoryForm').reset();
  document.getElementById('catIcon').value = '🍱';
  document.getElementById('catStatus').value = 'Active';
}

async function handleCategorySubmit(event) {
  event.preventDefault();

  const editingId = document.getElementById('editingCategoryId').value;
  const name = document.getElementById('catName').value.trim();
  let slug = document.getElementById('catSlug').value.trim();
  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  const icon = document.getElementById('catIcon').value.trim() || '🍱';
  const status = document.getElementById('catStatus').value;
  const description = document.getElementById('catDesc').value.trim();

  const categoryData = {
    id: editingId || ('cat-' + Date.now()),
    name,
    slug,
    icon,
    status,
    description
  };

  await Api.saveCategory(categoryData);

  if (editingId) {
    const idx = (AdminState.categories || []).findIndex(c => c.id === editingId);
    if (idx >= 0) {
      AdminState.categories[idx] = categoryData;
    }
    alert(`Category "${name}" updated successfully!`);
  } else {
    AdminState.categories.unshift(categoryData);
    alert(`Category "${name}" created and added!`);
  }

  renderCategoriesTable();
  syncCategoryDropdowns();
  syncSubcategoriesDropdownForProduct();
  cancelCategoryEditMode();
}

function deleteCategory(categoryId) {
  if (!categoryId) return;
  const cat = (AdminState.categories || []).find(c => c.id === categoryId || c.name === categoryId);
  const name = cat ? cat.name : 'this category';
  const targetId = cat ? cat.id : categoryId;

  // Check if subcategories depend on this category
  const dependentSubs = (AdminState.subcategories || []).filter(s =>
    s.parent && s.parent.toLowerCase() === (name || '').toLowerCase()
  );

  let message = `Are you sure you want to permanently delete category <strong>"${name}"</strong>?`;
  if (dependentSubs.length > 0) {
    message += `<br><span style="color: var(--admin-red); font-size: 13px; margin-top: 6px; display: block;">⚠️ Warning: ${dependentSubs.length} subcategory(s) currently use this as their parent category.</span>`;
  }

  showDeleteModal({
    title: '🗑️ Delete Parent Category',
    message: message,
    onConfirm: async () => {
      await Api.deleteCategory(targetId);
      AdminState.categories = (AdminState.categories || []).filter(c => c.id !== targetId && c.name !== name);
      renderCategoriesTable();
      syncCategoryDropdowns();
      syncSubcategoriesDropdownForProduct();
    }
  });
}

function syncCategoryDropdowns() {
  // 1. Sync Subcategory Form's Parent Category Dropdown
  const subcatParentSelect = document.getElementById('subcatParent');
  if (subcatParentSelect) {
    const currentVal = subcatParentSelect.value;
    subcatParentSelect.innerHTML = '<option value="">-- Select Parent Category --</option>';

    if (!AdminState.categories || AdminState.categories.length === 0) {
      const opt = document.createElement('option');
      opt.value = "";
      opt.disabled = true;
      opt.textContent = "-- No Categories Created Yet (Create in Categories Tab) --";
      subcatParentSelect.appendChild(opt);
    } else {
      AdminState.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = `${cat.icon || '📂'} ${cat.name}`;
        if (cat.name === currentVal) opt.selected = true;
        subcatParentSelect.appendChild(opt);
      });
    }
  }

  // 2. Sync Product Form's Category Dropdown
  const newProdCatSelect = document.getElementById('newProdCategory');
  if (newProdCatSelect) {
    const currentVal = newProdCatSelect.value;
    newProdCatSelect.innerHTML = '<option value="">-- Select Category --</option>';

    if (AdminState.categories && AdminState.categories.length > 0) {
      AdminState.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.slug || cat.id;
        opt.textContent = `${cat.icon || '📂'} ${cat.name}`;
        if (opt.value === currentVal || cat.name === currentVal) {
          opt.selected = true;
        }
        newProdCatSelect.appendChild(opt);
      });
    }
  }
}

// 7. SUBCATEGORIES MANAGEMENT (CREATE & EDIT MODE)
function renderSubcategories() {
  const tbody = document.getElementById('subcategoriesTableBody');
  const fallbackContainer = document.getElementById('subcategoriesList');
  if (!tbody && !fallbackContainer) return;

  const rows = (AdminState.subcategories || []).map((sub, index) => {
    if (!sub.id || sub.id === 'undefined') {
      sub.id = 'sub-' + (index + 1) + '-' + (sub.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    const isInactive = sub.status === 'Inactive';
    const statusBg = isInactive ? 'var(--admin-red-light)' : 'var(--admin-green-light)';
    const statusColor = isInactive ? 'var(--admin-red)' : 'var(--admin-green)';
    const itemCount = (sub.itemCount !== undefined && sub.itemCount !== null) ? sub.itemCount : 0;
    const slug = sub.slug || (sub.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return `
      <tr>
        <td style="font-size: 24px; text-align: center;">${sub.icon || '🍱'}</td>
        <td>
          <strong style="color: #0f172a; font-size: 14px;">${sub.name}</strong>
          ${sub.description ? `<div style="font-size: 12px; color: var(--admin-muted); margin-top: 3px;">${sub.description}</div>` : ''}
        </td>
        <td>
          <span class="badge badge-primary" style="font-size: 12px; padding: 4px 8px;">${sub.parent}</span>
        </td>
        <td>
          <code style="font-size: 11px; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; color: #475569;">${slug}</code>
        </td>
        <td>
          <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${statusBg}; color: ${statusColor};">
            ${sub.status || 'Active'}
          </span>
        </td>
        <td>
          <strong>${itemCount} items</strong>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 12px; font-size: 12px; margin-right: 6px;" onclick="editSubcategory('${sub.id}')">
            ✏️ Edit
          </button>
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 12px; color: var(--admin-red);" onclick="deleteSubcategory('${sub.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (tbody) {
    tbody.innerHTML = rows.length ? rows : `<tr><td colspan="7" style="text-align: center; color: var(--admin-muted); padding: 32px;">No subcategories found. Click "+ New Subcategory" above to add your first one!</td></tr>`;
  }
}

function startNewSubcategoryMode() {
  document.getElementById('editingSubcategoryId').value = '';
  document.getElementById('subcategoryFormTitle').innerHTML = '➕ Add New Subcategory';
  document.getElementById('saveSubcatSubmitBtn').textContent = '💾 Save Subcategory';
  document.getElementById('cancelSubcatEditBtn').style.display = 'none';

  document.getElementById('adminSubcategoryForm').reset();
  document.getElementById('subcatIcon').value = '🍱';
  document.getElementById('subcatStatus').value = 'Active';
  document.getElementById('subcatItemCount').value = '0';

  const panel = document.getElementById('subcategoryFormPanel');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth' });
  }
  const input = document.getElementById('subcatName');
  if (input) input.focus();
}

function editSubcategory(subcategoryId) {
  const sub = AdminState.subcategories.find(s => s.id === subcategoryId);
  if (!sub) return;

  switchAdminTab('subcategories');

  document.getElementById('editingSubcategoryId').value = sub.id;
  document.getElementById('subcategoryFormTitle').innerHTML = `✏️ Edit Subcategory: <span style="color: var(--admin-blue);">${sub.name}</span>`;
  document.getElementById('saveSubcatSubmitBtn').textContent = '💾 Update Subcategory Changes';
  document.getElementById('cancelSubcatEditBtn').style.display = 'inline-flex';

  document.getElementById('subcatName').value = sub.name || '';
  document.getElementById('subcatParent').value = sub.parent || 'Kitchen Combos';
  document.getElementById('subcatIcon').value = sub.icon || '🍱';
  document.getElementById('subcatSlug').value = sub.slug || '';
  document.getElementById('subcatStatus').value = sub.status || 'Active';
  document.getElementById('subcatItemCount').value = sub.itemCount || 0;
  document.getElementById('subcatDesc').value = sub.description || '';

  const panel = document.getElementById('subcategoryFormPanel');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth' });
  }
  const input = document.getElementById('subcatName');
  if (input) input.focus();
}

function cancelSubcategoryEditMode() {
  document.getElementById('editingSubcategoryId').value = '';
  document.getElementById('subcategoryFormTitle').innerHTML = '➕ Add New Subcategory';
  document.getElementById('saveSubcatSubmitBtn').textContent = '💾 Save Subcategory';
  document.getElementById('cancelSubcatEditBtn').style.display = 'none';

  document.getElementById('adminSubcategoryForm').reset();
  document.getElementById('subcatIcon').value = '🍱';
  document.getElementById('subcatStatus').value = 'Active';
  document.getElementById('subcatItemCount').value = '0';
}

async function handleSubcategorySubmit(event) {
  event.preventDefault();

  const editingId = document.getElementById('editingSubcategoryId').value;
  const name = document.getElementById('subcatName').value.trim();
  const parent = document.getElementById('subcatParent').value;
  const icon = document.getElementById('subcatIcon').value.trim() || '🍱';
  let slug = document.getElementById('subcatSlug').value.trim();
  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  const status = document.getElementById('subcatStatus').value;
  const itemCount = parseInt(document.getElementById('subcatItemCount').value) || 0;
  const description = document.getElementById('subcatDesc').value.trim();

  const subcategoryData = {
    id: editingId || ('sub-' + Date.now()),
    name,
    parent,
    icon,
    slug,
    status,
    itemCount,
    description
  };

  await Api.saveSubcategory(subcategoryData);

  if (editingId) {
    const idx = AdminState.subcategories.findIndex(s => s.id === editingId);
    if (idx >= 0) {
      AdminState.subcategories[idx] = subcategoryData;
    }
    alert(`Subcategory "${name}" updated successfully!`);
  } else {
    AdminState.subcategories.unshift(subcategoryData);
    alert(`Subcategory "${name}" created and added!`);
  }

  renderSubcategories();
  syncSubcategoriesDropdownForProduct();
  cancelSubcategoryEditMode();
}

function deleteSubcategory(subcategoryId) {
  if (!subcategoryId) return;
  const sub = AdminState.subcategories.find(s => s.id === subcategoryId || s.name === subcategoryId);
  const name = sub ? sub.name : 'this subcategory';
  const targetId = sub ? sub.id : subcategoryId;

  showDeleteModal({
    title: '🗑️ Delete Subcategory',
    message: `Are you sure you want to permanently delete the subcategory <strong>"${name}"</strong>?`,
    onConfirm: async () => {
      await Api.deleteSubcategory(targetId);
      AdminState.subcategories = AdminState.subcategories.filter(s => s.id !== targetId && s.name !== name);
      renderSubcategories();
      syncSubcategoriesDropdownForProduct();
    }
  });
}

function syncSubcategoriesDropdownForProduct() {
  const select = document.getElementById('newProdSubcategory');
  if (!select) return;

  const currentCategory = document.getElementById('newProdCategory') ? document.getElementById('newProdCategory').value : '';

  // Dynamically resolve target parent category name from AdminState.categories
  let targetParent = '';
  if (currentCategory && AdminState.categories) {
    const matched = AdminState.categories.find(c =>
      (c.slug && c.slug === currentCategory) ||
      (c.id && c.id === currentCategory) ||
      (c.name && c.name.toLowerCase() === currentCategory.toLowerCase())
    );
    if (matched) {
      targetParent = matched.name;
    }
  }

  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Select Subcategory (Optional) --</option>';

  const filtered = (AdminState.subcategories || []).filter(sub => {
    if (!targetParent) return true;
    return sub.parent && sub.parent.toLowerCase() === targetParent.toLowerCase();
  });

  const listToRender = filtered.length > 0 ? filtered : (AdminState.subcategories || []);

  listToRender.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub.name;
    opt.textContent = `${sub.icon || '🍱'} ${sub.name} (${sub.parent})`;
    if (sub.name === currentVal) opt.selected = true;
    select.appendChild(opt);
  });
}

// 7. SHIPPING SETTINGS (CRUD: CREATE, EDIT, UPDATE, DELETE BY STATE / UT)
function renderShippingSettings() {
  const tbody = document.getElementById('shippingZonesTableBody');
  if (!tbody) return;

  const rows = (AdminState.shippingZones || []).map(z => {
    const stateName = z.state || z.zone || 'Unknown State';
    const numMatch = (z.rate || '').toString().match(/\d+/);
    const amount = numMatch ? numMatch[0] : (z.amount !== undefined ? z.amount : '40');
    const isInactive = z.status === 'Inactive';
    const statusBg = isInactive ? 'var(--admin-red-light)' : 'var(--admin-green-light)';
    const statusColor = isInactive ? 'var(--admin-red)' : 'var(--admin-green)';
    const toggleIcon = isInactive ? '🟢' : '⏸️';
    const toggleTitle = isInactive ? 'Activate this shipping zone' : 'Deactivate this shipping zone';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">📍</span>
            <strong style="font-size: 14px; color: #0f172a;">${stateName}</strong>
          </div>
        </td>
        <td>
          <strong style="color: var(--admin-blue); font-size: 15px;">₹${amount}</strong>
        </td>
        <td>
          <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${statusBg}; color: ${statusColor};">
            ${z.status || 'Active'}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 12px; margin-right: 6px;" title="${toggleTitle}" onclick="toggleShippingZoneStatus('${z.id}')">
            ${toggleIcon} ${isInactive ? 'Activate' : 'Deactivate'}
          </button>
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 12px; font-size: 12px; margin-right: 6px;" onclick="editShippingZone('${z.id}')">
            ✏️ Edit
          </button>
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 12px; color: var(--admin-red);" onclick="deleteShippingZone('${z.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows.length ? rows : `<tr><td colspan="4" style="text-align: center; color: var(--admin-muted); padding: 30px;">No shipping zones configured yet. Click "➕ Add Shipping Zone" above to add your first state.</td></tr>`;
}

async function toggleShippingZoneStatus(zoneId) {
  const zone = AdminState.shippingZones.find(z => z.id === zoneId);
  if (!zone) return;

  const currentStatus = zone.status || 'Active';
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  zone.status = newStatus;

  await Api.saveShippingZone(zone);
  renderShippingSettings();

  const stateName = zone.state || zone.zone || 'Shipping Zone';
  showAdminToast(`"${stateName}" is now ${newStatus}. ${newStatus === 'Active' ? 'It is now visible on the checkout page.' : 'It is now hidden from customer checkout.'}`);
}

function startNewShippingZoneMode() {
  switchAdminTab('shipping');

  document.getElementById('editingShippingZoneId').value = '';
  document.getElementById('shippingFormTitle').textContent = '➕ Add Shipping Zone';
  document.getElementById('saveShippingSubmitBtn').textContent = '💾 Save Shipping Zone';
  document.getElementById('cancelShippingEditBtn').style.display = 'none';

  document.getElementById('adminShippingForm').reset();
  const stateSelect = document.getElementById('zoneStateSelect');
  if (stateSelect) stateSelect.value = '';
  const amountInput = document.getElementById('zoneShippingAmount');
  if (amountInput) amountInput.value = '';
  const statusSelect = document.getElementById('zoneStatus');
  if (statusSelect) statusSelect.value = 'Active';

  const panel = document.getElementById('shippingZoneFormPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  if (stateSelect) stateSelect.focus();
}

function editShippingZone(zoneId) {
  const zone = AdminState.shippingZones.find(z => z.id === zoneId);
  if (!zone) return;

  switchAdminTab('shipping');

  const stateName = zone.state || zone.zone || '';
  const numMatch = (zone.rate || '').toString().match(/\d+/);
  const amount = numMatch ? numMatch[0] : (zone.amount !== undefined ? zone.amount : '40');

  document.getElementById('editingShippingZoneId').value = zone.id;
  document.getElementById('shippingFormTitle').innerHTML = `✏️ Edit Shipping Zone: <span style="color: var(--admin-blue);">${stateName}</span>`;
  document.getElementById('saveShippingSubmitBtn').textContent = '💾 Update Shipping Zone';
  document.getElementById('cancelShippingEditBtn').style.display = 'inline-flex';

  const stateSelect = document.getElementById('zoneStateSelect');
  if (stateSelect) stateSelect.value = stateName;
  const amountInput = document.getElementById('zoneShippingAmount');
  if (amountInput) amountInput.value = amount;
  const statusSelect = document.getElementById('zoneStatus');
  if (statusSelect) statusSelect.value = zone.status || 'Active';

  const panel = document.getElementById('shippingZoneFormPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  if (amountInput) amountInput.focus();
}

function cancelShippingEditMode() {
  document.getElementById('editingShippingZoneId').value = '';
  document.getElementById('shippingFormTitle').textContent = '➕ Add Shipping Zone';
  document.getElementById('saveShippingSubmitBtn').textContent = '💾 Save Shipping Zone';
  document.getElementById('cancelShippingEditBtn').style.display = 'none';

  document.getElementById('adminShippingForm').reset();
  const statusSelect = document.getElementById('zoneStatus');
  if (statusSelect) statusSelect.value = 'Active';
}

async function handleShippingFormSubmit(event) {
  event.preventDefault();

  const editingId = document.getElementById('editingShippingZoneId').value;
  const state = document.getElementById('zoneStateSelect').value.trim();
  const amountVal = document.getElementById('zoneShippingAmount').value.trim();
  const statusVal = document.getElementById('zoneStatus')?.value || 'Active';
  const rateNum = parseInt(amountVal, 10);

  if (!state) {
    alert('Please select a State or Union Territory!');
    return;
  }
  if (isNaN(rateNum) || rateNum < 0) {
    alert('Please enter a valid shipping amount (₹)!');
    return;
  }

  // Duplicate Check: prevent adding multiple entries for the same state / UT
  const existingDup = (AdminState.shippingZones || []).find(z => {
    if (editingId && z.id === editingId) return false;
    const zState = (z.state || z.zone || '').trim().toLowerCase();
    return zState === state.toLowerCase();
  });

  if (existingDup) {
    alert(`A shipping zone for "${state}" already exists (Rate: ₹${existingDup.amount || existingDup.rate || rateNum}). Please edit the existing entry instead of creating a duplicate.`);
    return;
  }

  const zoneData = {
    id: editingId || ('zone-' + Date.now()),
    state: state,
    zone: state,
    amount: rateNum,
    rate: `₹${rateNum}`,
    status: statusVal
  };

  await Api.saveShippingZone(zoneData);

  if (editingId) {
    const idx = AdminState.shippingZones.findIndex(z => z.id === editingId);
    if (idx >= 0) AdminState.shippingZones[idx] = zoneData;
    showAdminToast(`Shipping Zone "${state}" updated to ₹${rateNum} (${statusVal})!`);
  } else {
    AdminState.shippingZones.push(zoneData);
    showAdminToast(`Shipping Zone "${state}" added with rate ₹${rateNum} (${statusVal})!`);
  }

  renderShippingSettings();
  cancelShippingEditMode();
}

function deleteShippingZone(zoneId) {
  const zone = AdminState.shippingZones.find(z => z.id === zoneId);
  const name = zone ? (zone.state || zone.zone) : 'this shipping zone';

  showDeleteModal({
    title: '🗑️ Delete Shipping Zone',
    message: `Are you sure you want to permanently delete shipping rate for <strong>"${name}"</strong>? Customers will no longer be able to select this state at checkout.`,
    onConfirm: async () => {
      await Api.deleteShippingZone(zoneId);
      AdminState.shippingZones = AdminState.shippingZones.filter(z => z.id !== zoneId);
      renderShippingSettings();
    }
  });
}

// 8. BLOGS & RECIPES (CRUD: CREATE, EDIT, UPDATE, DELETE)
function renderBlogsList() {
  const tbody = document.getElementById('blogsTableBody');
  const fallback = document.getElementById('blogsList');
  if (!tbody && !fallback) return;

  const rows = (AdminState.blogs || []).map(b => {
    const isDraft = b.status === 'Draft';
    const statusBg = isDraft ? 'var(--admin-amber-light)' : 'var(--admin-green-light)';
    const statusColor = isDraft ? 'var(--admin-amber)' : 'var(--admin-green)';

    return `
      <tr>
        <td style="font-size: 26px; text-align: center;">${b.icon || '🍲'}</td>
        <td>
          <strong style="font-size: 14px; color: #0f172a;">${b.title}</strong>
          ${b.summary ? `<div style="font-size: 12px; color: var(--admin-muted); margin-top: 3px;">${b.summary}</div>` : ''}
        </td>
        <td>
          <strong>${b.author}</strong>
          <div style="font-size: 12px; color: var(--admin-muted);">${b.category || 'Culinary Recipes'}</div>
        </td>
        <td>
          <span style="font-size: 13px;">${b.date}</span>
        </td>
        <td>
          <span style="font-size: 13px; font-weight: 600;">👁️ ${b.views || 0} reads</span>
        </td>
        <td>
          <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${statusBg}; color: ${statusColor};">
            ${b.status || 'Published'}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 12px; font-size: 12px; margin-right: 6px;" onclick="editBlog('${b.id}')">
            ✏️ Edit
          </button>
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 5px 10px; font-size: 12px; color: var(--admin-red);" onclick="deleteBlog('${b.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (tbody) {
    tbody.innerHTML = rows.length ? rows : `<tr><td colspan="7" style="text-align: center; color: var(--admin-muted); padding: 30px;">No recipes or blog articles published yet. Click "+ Write Recipe Post" to add one!</td></tr>`;
  }
}

function startNewBlogMode() {
  document.getElementById('editingBlogId').value = '';
  document.getElementById('blogFormTitle').textContent = '➕ Write Kitchen Recipe / Article';
  document.getElementById('saveBlogSubmitBtn').textContent = '💾 Publish / Save Article';
  document.getElementById('cancelBlogEditBtn').style.display = 'none';

  document.getElementById('adminBlogForm').reset();
  document.getElementById('blogPostAuthor').value = 'Chef Ilampirai';
  document.getElementById('blogPostCategory').value = 'Authentic Recipes';
  document.getElementById('blogPostIcon').value = '🍲';
  document.getElementById('blogPostStatus').value = 'Published';
  document.getElementById('blogPostDate').value = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  const panel = document.getElementById('blogFormPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  const input = document.getElementById('blogPostTitle');
  if (input) input.focus();
}

function editBlog(blogId) {
  const blog = AdminState.blogs.find(b => b.id === blogId);
  if (!blog) return;

  switchAdminTab('blogs');

  document.getElementById('editingBlogId').value = blog.id;
  document.getElementById('blogFormTitle').innerHTML = `✏️ Edit Recipe Post: <span style="color: var(--admin-blue);">${blog.title}</span>`;
  document.getElementById('saveBlogSubmitBtn').textContent = '💾 Update Recipe Post';
  document.getElementById('cancelBlogEditBtn').style.display = 'inline-flex';

  document.getElementById('blogPostTitle').value = blog.title || '';
  document.getElementById('blogPostAuthor').value = blog.author || 'Chef Ilampirai';
  document.getElementById('blogPostCategory').value = blog.category || 'Authentic Recipes';
  document.getElementById('blogPostDate').value = blog.date || '';
  document.getElementById('blogPostIcon').value = blog.icon || '🍲';
  document.getElementById('blogPostStatus').value = blog.status || 'Published';
  document.getElementById('blogPostSummary').value = blog.summary || '';
  document.getElementById('blogPostContent').value = blog.content || '';

  const panel = document.getElementById('blogFormPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  const input = document.getElementById('blogPostTitle');
  if (input) input.focus();
}

function cancelBlogEditMode() {
  document.getElementById('editingBlogId').value = '';
  document.getElementById('blogFormTitle').textContent = '➕ Write Kitchen Recipe / Article';
  document.getElementById('saveBlogSubmitBtn').textContent = '💾 Publish / Save Article';
  document.getElementById('cancelBlogEditBtn').style.display = 'none';

  document.getElementById('adminBlogForm').reset();
}

async function handleBlogFormSubmit(event) {
  event.preventDefault();

  const editingId = document.getElementById('editingBlogId').value;
  const title = document.getElementById('blogPostTitle').value.trim();
  const author = document.getElementById('blogPostAuthor').value.trim();
  const category = document.getElementById('blogPostCategory').value;
  const date = document.getElementById('blogPostDate').value.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const icon = document.getElementById('blogPostIcon').value.trim() || '🍲';
  const status = document.getElementById('blogPostStatus').value;
  const summary = document.getElementById('blogPostSummary').value.trim();
  const content = document.getElementById('blogPostContent').value.trim();

  const blogData = {
    id: editingId || ('blog-' + Date.now()),
    title,
    author,
    category,
    date,
    icon,
    status,
    views: editingId ? (AdminState.blogs.find(b => b.id === editingId)?.views || 100) : 1,
    summary,
    content
  };

  await Api.saveBlog(blogData);

  if (editingId) {
    const idx = AdminState.blogs.findIndex(b => b.id === editingId);
    if (idx >= 0) AdminState.blogs[idx] = blogData;
    alert(`Recipe article "${title}" updated successfully!`);
  } else {
    AdminState.blogs.unshift(blogData);
    alert(`Recipe article "${title}" published successfully!`);
  }

  renderBlogsList();
  cancelBlogEditMode();
}

function deleteBlog(blogId) {
  const blog = AdminState.blogs.find(b => b.id === blogId);
  const name = blog ? blog.title : 'this article';

  showDeleteModal({
    title: '🗑️ Delete Recipe Article',
    message: `Are you sure you want to permanently delete <strong>"${name}"</strong>?`,
    onConfirm: async () => {
      await Api.deleteBlog(blogId);
      AdminState.blogs = AdminState.blogs.filter(b => b.id !== blogId);
      renderBlogsList();
    }
  });
}

// Export CSV
function exportOrdersCSV() {
  if (AdminState.orders.length === 0) {
    alert('No orders to export!');
    return;
  }

  let csv = 'Order ID,Date,Customer Name,Phone,Total Amount,Payment,Status\n';
  AdminState.orders.forEach(o => {
    csv += `"${o.id}","${o.date}","${o.customer?.name || ''}","${o.customer?.phone || ''}","${o.totalAmount}","${o.paymentMethod}","${o.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `ilampirai_orders_${new Date().toISOString().split('T')[0]}.csv`);
  a.click();
}

// ==========================================================================
// 8. COUPONS MANAGEMENT (CREATE, EDIT, ACTIVATE, DEACTIVATE, DELETE)
// ==========================================================================
function renderCouponsTable() {
  const tbody = document.getElementById('couponsTableBody');
  if (!tbody) return;

  const coupons = AdminState.coupons || [];

  if (coupons.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-muted); padding: 30px;">No promotional coupons configured yet. Click "+ New Coupon" to create your first discount offer.</td></tr>`;
    return;
  }

  tbody.innerHTML = coupons.map(c => {
    const isActive = c.status !== 'Inactive';
    const statusBg = isActive ? 'var(--admin-green-light)' : 'var(--admin-red-light)';
    const statusColor = isActive ? 'var(--admin-green)' : 'var(--admin-red)';

    let discountBadge = '';
    if (c.discountType === 'percentage') {
      discountBadge = `<span style="font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">${c.discountValue}% OFF</span>`;
    } else if (c.discountType === 'flat') {
      discountBadge = `<span style="font-weight: 700; color: #2563eb; background: #dbeafe; padding: 2px 8px; border-radius: 4px;">Flat ₹${c.discountValue} OFF</span>`;
    } else {
      discountBadge = `<span style="font-weight: 700; color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 4px;">Free Shipping</span>`;
    }

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🏷️</span>
            <div>
              <strong style="font-family: monospace; font-size: 14px; letter-spacing: 0.5px; color: #0f172a; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1;">${c.code}</strong>
            </div>
          </div>
        </td>
        <td>${discountBadge}</td>
        <td>
          <strong style="color: var(--text-main);">₹${c.minSpend || 0}</strong>
        </td>
        <td style="max-width: 280px; font-size: 13px; color: var(--admin-muted);">
          ${c.desc || 'No description provided'}
        </td>
        <td>
          <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${statusBg}; color: ${statusColor};">
            ${c.status || 'Active'}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 4px 10px; font-size: 12px; margin-right: 6px;" onclick="toggleCouponStatus('${c.id}')" title="${isActive ? 'Deactivate Coupon' : 'Activate Coupon'}">
            ${isActive ? '⏸️ Deactivate' : '▶️ Activate'}
          </button>
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 4px 10px; font-size: 12px; margin-right: 6px;" onclick="editCoupon('${c.id}')">
            ✏️ Edit
          </button>
          <button type="button" class="btn-admin btn-admin-outline" style="padding: 4px 10px; font-size: 12px; color: var(--admin-red);" onclick="deleteCoupon('${c.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function startNewCouponMode() {
  document.getElementById('editingCouponId').value = '';
  document.getElementById('couponFormTitle').textContent = '➕ Create New Promotional Coupon';
  document.getElementById('saveCouponSubmitBtn').textContent = '💾 Save Coupon Code';
  document.getElementById('cancelCouponEditBtn').style.display = 'none';

  document.getElementById('adminCouponForm').reset();
  document.getElementById('couponDiscountType').value = 'percentage';
  onCouponTypeChange('percentage');
  document.getElementById('couponStatus').value = 'Active';
  document.getElementById('couponMinSpend').value = '299';
  document.getElementById('couponDiscountValue').value = '10';

  const panel = document.getElementById('couponFormPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  const input = document.getElementById('couponCode');
  if (input) input.focus();
}

function onCouponTypeChange(type) {
  const valueGroup = document.getElementById('couponValueGroup');
  const valueLabel = document.getElementById('couponValueLabel');
  const valueInput = document.getElementById('couponDiscountValue');

  if (type === 'free_shipping') {
    if (valueGroup) valueGroup.style.display = 'none';
    if (valueInput) valueInput.removeAttribute('required');
  } else if (type === 'flat') {
    if (valueGroup) valueGroup.style.display = 'block';
    if (valueLabel) valueLabel.textContent = 'Discount Amount (₹ Flat) *';
    if (valueInput) {
      valueInput.placeholder = 'e.g. 50';
      valueInput.max = '10000';
      valueInput.setAttribute('required', 'required');
    }
  } else {
    if (valueGroup) valueGroup.style.display = 'block';
    if (valueLabel) valueLabel.textContent = 'Discount Value (Percentage %) *';
    if (valueInput) {
      valueInput.placeholder = 'e.g. 15';
      valueInput.max = '100';
      valueInput.setAttribute('required', 'required');
    }
  }
}

function editCoupon(couponId) {
  const coupon = (AdminState.coupons || []).find(c => c.id === couponId);
  if (!coupon) return;

  switchAdminTab('coupons');

  document.getElementById('editingCouponId').value = coupon.id;
  document.getElementById('couponFormTitle').innerHTML = `✏️ Edit Coupon: <span style="color: var(--admin-blue); font-family: monospace;">${coupon.code}</span>`;
  document.getElementById('saveCouponSubmitBtn').textContent = '💾 Update Coupon Code';
  document.getElementById('cancelCouponEditBtn').style.display = 'inline-flex';

  document.getElementById('couponCode').value = coupon.code || '';
  const type = coupon.discountType || (coupon.freeShipping ? 'free_shipping' : 'percentage');
  document.getElementById('couponDiscountType').value = type;
  onCouponTypeChange(type);

  document.getElementById('couponDiscountValue').value = coupon.discountValue !== undefined ? coupon.discountValue : (coupon.discountPercent || 10);
  document.getElementById('couponMinSpend').value = coupon.minSpend || 0;
  document.getElementById('couponStatus').value = coupon.status || 'Active';
  document.getElementById('couponDesc').value = coupon.desc || '';

  const panel = document.getElementById('couponFormPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  const input = document.getElementById('couponCode');
  if (input) input.focus();
}

function cancelCouponEditMode() {
  document.getElementById('editingCouponId').value = '';
  document.getElementById('couponFormTitle').textContent = '➕ Create New Promotional Coupon';
  document.getElementById('saveCouponSubmitBtn').textContent = '💾 Save Coupon Code';
  document.getElementById('cancelCouponEditBtn').style.display = 'none';

  document.getElementById('adminCouponForm').reset();
  onCouponTypeChange('percentage');
}

async function handleCouponFormSubmit(event) {
  event.preventDefault();

  const editingId = document.getElementById('editingCouponId').value;
  const code = document.getElementById('couponCode').value.trim().toUpperCase();
  const discountType = document.getElementById('couponDiscountType').value;
  const discountValue = discountType === 'free_shipping' ? 0 : parseFloat(document.getElementById('couponDiscountValue').value || 0);
  const minSpend = parseFloat(document.getElementById('couponMinSpend').value || 0);
  const status = document.getElementById('couponStatus').value;
  const desc = document.getElementById('couponDesc').value.trim();

  if (!code) {
    alert('Please provide a coupon code!');
    return;
  }

  // Duplicate check when creating
  if (!editingId) {
    const exists = (AdminState.coupons || []).some(c => c.code && c.code.toUpperCase() === code);
    if (exists) {
      alert(`Coupon code "${code}" already exists! Please use a unique code or edit the existing one.`);
      return;
    }
  }

  const couponData = {
    id: editingId || ('coup-' + Date.now()),
    code,
    discountType,
    discountValue,
    minSpend,
    status,
    desc
  };

  await Api.saveCoupon(couponData);

  if (editingId) {
    const idx = AdminState.coupons.findIndex(c => c.id === editingId);
    if (idx >= 0) AdminState.coupons[idx] = couponData;
    alert(`Coupon "${code}" updated successfully!`);
  } else {
    AdminState.coupons.unshift(couponData);
    alert(`Coupon "${code}" created successfully!`);
  }

  renderCouponsTable();
  cancelCouponEditMode();
}

async function toggleCouponStatus(couponId) {
  const coupon = (AdminState.coupons || []).find(c => c.id === couponId);
  if (!coupon) return;

  const newStatus = coupon.status === 'Active' ? 'Inactive' : 'Active';
  coupon.status = newStatus;
  await Api.saveCoupon(coupon);
  renderCouponsTable();
  alert(`Coupon "${coupon.code}" status changed to: ${newStatus}`);
}

function deleteCoupon(couponId) {
  const coupon = (AdminState.coupons || []).find(c => c.id === couponId);
  const name = coupon ? coupon.code : 'this coupon';

  showDeleteModal({
    title: '🗑️ Delete Coupon Code',
    message: `Are you sure you want to permanently delete promotional coupon <strong>"${name}"</strong>? Customers will no longer be able to use it.`,
    onConfirm: async () => {
      await Api.deleteCoupon(couponId);
      AdminState.coupons = AdminState.coupons.filter(c => c.id !== couponId);
      renderCouponsTable();
    }
  });
}
