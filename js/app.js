/**
 * ILAMPIRAI KITCHENS — STOREFRONT LOGIC (HTML, CSS, JS)
 * Handles Views, Product Catalog, Filters, Cart, Checkout & Payment Simulation
 */

// Global App State
const AppState = {
  currentView: 'home',
  products: [],
  categories: [],
  subcategories: [],
  shippingZones: [],
  coupons: [],
  cart: JSON.parse(localStorage.getItem('ik_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('ik_wishlist') || '[]'),
  activeCategory: 'all',
  activeSubcategory: 'all',
  selectedProduct: null,
  activeWeightOption: null,
  appliedCoupon: null,
  activePaymentMethod: 'upi',
  selectedState: 'Tamil Nadu',
  shippingCost: 40,
  currentZone: null
};

// DOM Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await loadCatalogData();
  setupEventListeners();
  updateCartBadge();
  updateWishlistBadge();
  renderHeaderNavCategories();
  renderHomeCategoryCards();
  renderCatalogCategoryFilters();
  renderCatalogSubcategoryPills();
  renderProductsGrid();
  renderFeaturedCombos();
  renderCartView();
  checkUrlRoute();
});

// Load Products, Categories, Subcategories, Shipping Zones & Coupons
async function loadCatalogData() {
  AppState.products = await Api.getProducts();
  AppState.categories = await Api.getCategories();
  AppState.subcategories = await Api.getSubcategories();
  AppState.shippingZones = await Api.getShippingZones();
  AppState.coupons = await Api.getCoupons();
  renderCheckoutStateDropdown();
  updateShippingZoneForState(AppState.selectedState);
}

// Listen for Admin Panel changes (cross-tab or same-tab localStorage updates)
window.addEventListener('storage', (e) => {
  if (e.key === 'ik_shipping_zones') {
    const zones = JSON.parse(e.newValue || '[]');
    AppState.shippingZones = zones;
    renderCheckoutStateDropdown();
    updateShippingZoneForState(AppState.selectedState);
    renderCheckoutSummary();
  }
});

// Router
function navigateTo(viewName, productId = null) {
  AppState.currentView = viewName;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Hide all views
  document.querySelectorAll('.view-container').forEach(el => el.style.display = 'none');

  // Update nav active states
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.style.display = 'block';

  renderHeaderNavCategories();

  if (viewName === 'product-detail' && productId) {
    loadProductDetail(productId);
  } else if (viewName === 'cart') {
    renderCartView();
  } else if (viewName === 'checkout') {
    // Re-load shipping zones to pick up any Admin changes
    Api.getShippingZones().then(zones => {
      AppState.shippingZones = zones;
      renderCheckoutStateDropdown();
      renderCheckoutSummary();
    });
  } else if (viewName === 'categories') {
    renderCatalogCategoryFilters();
    renderCatalogSubcategoryPills();
    renderProductsGrid();
  }
}

// Mobile Menu Drawer Toggle (Left Side Drawer)
function toggleMobileMenu(isOpen) {
  const drawer = document.getElementById('mobileMenuDrawer');
  const overlay = document.getElementById('mobileMenuOverlay');
  if (drawer) drawer.classList.toggle('active', isOpen);
  if (overlay) overlay.classList.toggle('active', isOpen);
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// Category & Subcategory Selection Helpers
function selectNavCategory(catKey) {
  AppState.activeCategory = catKey;
  AppState.activeSubcategory = 'all'; // Default subcategory when choosing a category
  navigateTo('categories');
  renderProductsGrid();
  renderCatalogCategoryFilters();
  renderCatalogSubcategoryPills();
  renderHeaderNavCategories();
}

function selectSubcategoryFilter(subcatName) {
  AppState.activeSubcategory = subcatName;
  renderCatalogSubcategoryPills();
  renderProductsGrid();
}

// Render dynamic created categories in Header Nav & Left-side Mobile Drawer
function renderHeaderNavCategories() {
  const navContainer = document.getElementById('mainHeaderNavLinks');
  const mobileCatList = document.getElementById('mobileCategoriesList');

  // 1. Render in Desktop Header Navbar
  if (navContainer) {
    const isHome = AppState.currentView === 'home';
    const isAllProd = AppState.currentView === 'categories' && AppState.activeCategory === 'all';

    navContainer.innerHTML = `
      <li><a class="nav-link ${isHome ? 'active' : ''}" data-view="home" onclick="navigateTo('home')">Home</a></li>
      <li><a class="nav-link ${isAllProd ? 'active' : ''}" data-cat="all" onclick="selectNavCategory('all')">All Products</a></li>
    `;

    (AppState.categories || []).forEach(cat => {
      const catKey = cat.slug || cat.id;
      const isActive = AppState.currentView === 'categories' && AppState.activeCategory === catKey;
      const li = document.createElement('li');
      li.innerHTML = `<a class="nav-link ${isActive ? 'active' : ''}" data-cat="${catKey}" onclick="selectNavCategory('${catKey}')">${cat.icon || '🍱'} ${cat.name}</a>`;
      navContainer.appendChild(li);
    });
  }

  // 2. Render in Mobile Left Drawer Menu
  if (mobileCatList) {
    mobileCatList.innerHTML = (AppState.categories || []).map(cat => {
      const catKey = cat.slug || cat.id;
      const isActive = AppState.currentView === 'categories' && AppState.activeCategory === catKey;
      return `
        <li>
          <a class="mobile-nav-item ${isActive ? 'active' : ''}" data-cat="${catKey}" onclick="selectNavCategory('${catKey}'); toggleMobileMenu(false);">
            <span class="m-icon">${cat.icon || '🍱'}</span>
            <span>${cat.name}</span>
          </a>
        </li>
      `;
    }).join('');
  }
}

// Dynamically render category cards on Homepage
function renderHomeCategoryCards() {
  const container = document.querySelector('.categories-grid');
  if (!container || !AppState.categories || !AppState.categories.length) return;

  container.innerHTML = AppState.categories.map(cat => {
    const catKey = cat.slug || cat.id;
    const subCount = (AppState.subcategories || []).filter(s =>
      s.parent && s.parent.toLowerCase() === (cat.name || '').toLowerCase()
    ).length;
    const countLabel = subCount > 0 ? `${subCount} Subcategories` : (cat.description || 'Authentic Handcrafted');

    return `
      <div class="category-card" onclick="selectNavCategory('${catKey}')">
        <div class="category-icon">${cat.icon || '🍱'}</div>
        <div class="category-name">${cat.name}</div>
        <span class="category-count">${countLabel}</span>
      </div>
    `;
  }).join('');
}

// Render Category radios in Catalog Sidebar
function renderCatalogCategoryFilters() {
  const container = document.getElementById('catalogCategoryFilters');
  if (!container) return;

  const isAll = AppState.activeCategory === 'all';
  let html = `
    <label class="filter-checkbox">
      <input type="radio" name="catRadio" value="all" ${isAll ? 'checked' : ''}
        onchange="selectNavCategory('all')">
      All Products
    </label>
  `;

  (AppState.categories || []).forEach(cat => {
    const catKey = cat.slug || cat.id;
    const isChecked = AppState.activeCategory === catKey;
    html += `
      <label class="filter-checkbox">
        <input type="radio" name="catRadio" value="${catKey}" ${isChecked ? 'checked' : ''}
          onchange="selectNavCategory('${catKey}')">
        ${cat.icon || '🍱'} ${cat.name}
      </label>
    `;
  });

  container.innerHTML = html;
}

// Render Subcategory pills & sidebar filter
function renderCatalogSubcategoryPills() {
  const pillsContainer = document.getElementById('catalogSubcategoryPills');
  const sidebarContainer = document.getElementById('catalogSubcategoryFilters');

  let subsToShow = AppState.subcategories || [];
  if (AppState.activeCategory !== 'all') {
    const activeCatObj = (AppState.categories || []).find(c => (c.slug || c.id) === AppState.activeCategory);
    const activeCatName = activeCatObj ? activeCatObj.name.toLowerCase() : AppState.activeCategory.toLowerCase();
    const matched = subsToShow.filter(s => s.parent && s.parent.toLowerCase() === activeCatName);
    if (matched.length > 0) subsToShow = matched;
  }

  // Quick Horizontal Pills Bar
  if (pillsContainer) {
    const isAllSub = !AppState.activeSubcategory || AppState.activeSubcategory === 'all';
    let pillsHtml = `
      <button type="button" class="subcat-pill ${isAllSub ? 'active' : ''}" onclick="selectSubcategoryFilter('all')">
        ✨ All Subcategories
      </button>
    `;

    subsToShow.forEach(sub => {
      const isSubActive = AppState.activeSubcategory && AppState.activeSubcategory.toLowerCase() === sub.name.toLowerCase();
      pillsHtml += `
        <button type="button" class="subcat-pill ${isSubActive ? 'active' : ''}" onclick="selectSubcategoryFilter('${sub.name.replace(/'/g, "\\'")}')">
          ${sub.icon || '🍱'} ${sub.name}
        </button>
      `;
    });

    pillsContainer.innerHTML = pillsHtml;
  }

  // Sidebar Filter Radios
  if (sidebarContainer) {
    const isAllSub = !AppState.activeSubcategory || AppState.activeSubcategory === 'all';
    let sideHtml = `
      <label class="filter-checkbox">
        <input type="radio" name="subcatRadio" value="all" ${isAllSub ? 'checked' : ''}
          onchange="selectSubcategoryFilter('all')">
        All Subcategories
      </label>
    `;

    subsToShow.forEach(sub => {
      const isSubActive = AppState.activeSubcategory && AppState.activeSubcategory.toLowerCase() === sub.name.toLowerCase();
      sideHtml += `
        <label class="filter-checkbox">
          <input type="radio" name="subcatRadio" value="${sub.name.replace(/'/g, "\\'")}" ${isSubActive ? 'checked' : ''}
            onchange="selectSubcategoryFilter('${sub.name.replace(/'/g, "\\'")}')">
          ${sub.icon || '🍱'} ${sub.name}
        </label>
      `;
    });

    sidebarContainer.innerHTML = sideHtml;
  }
}

function checkUrlRoute() {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('product-')) {
    const prodId = hash.replace('product-', '');
    navigateTo('product-detail', prodId);
  } else if (['categories', 'cart', 'checkout'].includes(hash)) {
    navigateTo(hash);
  } else {
    navigateTo('home');
  }
}

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ==========================================================================
// CATALOG & PRODUCTS
// ==========================================================================
function renderProductsGrid() {
  const grid = document.getElementById('catalogProductsGrid');
  if (!grid) return;

  let filtered = [...AppState.products];

  // Category filter
  if (AppState.activeCategory !== 'all') {
    const activeCatObj = (AppState.categories || []).find(c => (c.slug || c.id) === AppState.activeCategory);
    const activeCatName = activeCatObj ? activeCatObj.name.toLowerCase() : AppState.activeCategory.toLowerCase();

    filtered = filtered.filter(p => {
      return (
        p.category === AppState.activeCategory ||
        (p.categoryName && p.categoryName.toLowerCase() === activeCatName) ||
        (p.categoryName && p.categoryName.toLowerCase() === AppState.activeCategory.toLowerCase())
      );
    });
  }

  // Subcategory filter: user can change subcategory for all products
  if (AppState.activeSubcategory && AppState.activeSubcategory !== 'all') {
    const targetSub = AppState.activeSubcategory.toLowerCase();
    filtered = filtered.filter(p => {
      return (
        (p.subcategory && p.subcategory.toLowerCase() === targetSub) ||
        (p.comboType && p.comboType.toLowerCase() === targetSub) ||
        (p.name && p.name.toLowerCase().includes(targetSub))
      );
    });
  }

  // Weight filter
  const selectedWeightCheckboxes = Array.from(document.querySelectorAll('.filter-weight:checked')).map(cb => cb.value);
  if (selectedWeightCheckboxes.length > 0) {
    filtered = filtered.filter(p => p.weights.some(w => selectedWeightCheckboxes.includes(w.weight)));
  }

  // Sort
  const sortVal = document.getElementById('sortSelect')?.value || 'featured';
  if (sortVal === 'price-low') {
    filtered.sort((a, b) => a.weights[0].price - b.weights[0].price);
  } else if (sortVal === 'price-high') {
    filtered.sort((a, b) => b.weights[0].price - a.weights[0].price);
  } else if (sortVal === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  const countElem = document.getElementById('catalogCount');
  if (countElem) {
    const subLabel = AppState.activeSubcategory && AppState.activeSubcategory !== 'all' ? ` &middot; "${AppState.activeSubcategory}"` : '';
    countElem.innerHTML = `Showing <strong>${filtered.length}</strong> products${subLabel}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
        <h3>No products found</h3>
        <p style="color: var(--text-muted); margin-bottom: 16px;">Try adjusting your category or subcategory selection.</p>
        <button class="btn btn-secondary btn-sm" onclick="selectSubcategoryFilter('all'); selectNavCategory('all');">Reset Filters</button>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(prod => createProductCardHTML(prod)).join('');
}

function renderFeaturedCombos() {
  const container = document.getElementById('featuredCombosGrid');
  if (!container) return;

  const combos = AppState.products.filter(p => p.category === 'combos' || p.isBestseller).slice(0, 4);
  container.innerHTML = combos.map(prod => createProductCardHTML(prod)).join('');
}

function createProductCardHTML(prod) {
  const defaultWeight = prod.weights[0];
  const isWishlisted = AppState.wishlist.includes(prod.id);
  const mediaHtml = prod.image
    ? `<img src="${prod.image}" alt="${prod.name}" class="product-card-img">`
    : `<div class="product-emoji-icon">${prod.emoji}</div>`;

  return `
    <div class="product-card" data-product-id="${prod.id}">
      ${prod.badge ? `<span class="card-badge-tag badge badge-orange">${prod.badge}</span>` : ''}
      <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${prod.id}', event)">
        ${isWishlisted ? '❤️' : '🤍'}
      </button>

      <div class="product-image-wrap" onclick="navigateTo('product-detail', '${prod.id}')">
        ${mediaHtml}
      </div>

      <div class="product-content">
        <span class="product-category-label">${prod.comboType || prod.categoryName}</span>
        <h3 class="product-title" onclick="navigateTo('product-detail', '${prod.id}')">${prod.name}</h3>

        <div class="product-rating">
          <span class="stars">★★★★★</span>
          <span style="font-weight: 700;">${prod.rating}</span>
          <span class="review-count">(${prod.reviewsCount})</span>
        </div>

        <div class="weight-selector-row">
          ${prod.weights.map((w, idx) => `
            <button class="weight-pill ${idx === 0 ? 'selected' : ''}" 
              onclick="selectCardWeight('${prod.id}', '${w.weight}', ${w.price}, ${w.originalPrice || 0}, this, event)">
              ${w.weight}
            </button>
          `).join('')}
        </div>

        <div class="product-card-footer">
          <div class="price-box">
            <span class="price-current" id="price-display-${prod.id}">₹${defaultWeight.price}</span>
            ${defaultWeight.originalPrice ? `<span class="price-original" id="orig-display-${prod.id}">₹${defaultWeight.originalPrice}</span>` : ''}
          </div>
          <button class="btn btn-primary btn-sm" onclick="quickAddToCart('${prod.id}', event)">
            ➕ Add
          </button>
        </div>
      </div>
    </div>
  `;
}

function selectCardWeight(productId, weight, price, origPrice, pillElement, event) {
  event.stopPropagation();
  const card = pillElement.closest('.product-card');
  card.querySelectorAll('.weight-pill').forEach(p => p.classList.remove('selected'));
  pillElement.classList.add('selected');

  const priceElem = card.querySelector(`#price-display-${productId}`);
  if (priceElem) priceElem.textContent = `₹${price}`;

  const origElem = card.querySelector(`#orig-display-${productId}`);
  if (origElem && origPrice) origElem.textContent = `₹${origPrice}`;

  card.dataset.selectedWeight = weight;
  card.dataset.selectedPrice = price;
}

// ==========================================================================
// PRODUCT DETAIL VIEW
// ==========================================================================
function loadProductDetail(productId) {
  const prod = AppState.products.find(p => p.id === productId);
  if (!prod) return;

  AppState.selectedProduct = prod;
  AppState.activeWeightOption = prod.weights[0];

  const detailContainer = document.getElementById('productDetailContent');
  if (!detailContainer) return;

  const detailMediaHtml = prod.image
    ? `<img src="${prod.image}" alt="${prod.name}" style="max-height: 320px; max-width: 320px; object-fit: contain; border-radius: 12px; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));">`
    : `<span>${prod.emoji}</span>`;

  detailContainer.innerHTML = `
    <div class="product-detail-view">
      <div class="detail-gallery">
        <div class="detail-main-display">
          ${detailMediaHtml}
        </div>
      </div>


      <div class="detail-info">
        <div class="detail-breadcrumbs">
          <a href="#" onclick="navigateTo('home'); return false;">Home</a> / 
          <a href="#" onclick="navigateTo('categories'); return false;">${prod.categoryName}</a> / 
          <span>${prod.comboType}</span>
        </div>

        <h1 class="detail-title">${prod.name}</h1>

        <div class="product-rating" style="margin-bottom: 16px;">
          <span class="stars" style="font-size: 18px;">★★★★★</span>
          <span style="font-weight: 700; font-size: 16px;">${prod.rating}</span>
          <span class="review-count">(${prod.reviewsCount} customer reviews)</span>
          <span class="badge badge-success" style="margin-left: 10px;">100% Stone Ground</span>
        </div>

        <div class="detail-stock-indicator">
          <span class="stock-dot"></span>
          <span>In Stock (${prod.stock || 25} available fresh packings ready)</span>
        </div>

        <p class="detail-desc">${prod.description}</p>

        <div style="margin-bottom: 24px;">
          <label style="font-size: 14px; font-weight: 700; display: block; margin-bottom: 8px;">
            Choose Pack Size / Weight:
          </label>
          <div style="display: flex; gap: 10px;">
            ${prod.weights.map((w, i) => `
              <button class="weight-pill ${i === 0 ? 'selected' : ''}" style="padding: 8px 18px; font-size: 14px;"
                onclick="setDetailWeight('${w.weight}', ${w.price}, ${w.originalPrice || 0}, this)">
                <strong>${w.weight}</strong> — ₹${w.price}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; align-items: baseline; gap: 14px; margin-bottom: 24px;">
          <span id="detailPriceDisplay" style="font-size: 32px; font-weight: 800; color: var(--primary-hover);">
            ₹${prod.weights[0].price}
          </span>
          <span id="detailOrigPriceDisplay" style="font-size: 18px; color: var(--text-light); text-decoration: line-through;">
            ₹${prod.weights[0].originalPrice || ''}
          </span>
          <span class="badge badge-orange">Save 20%</span>
        </div>

        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 32px; flex-wrap: wrap;">
          <div class="qty-stepper">
            <button class="qty-btn" onclick="stepDetailQty(-1)">−</button>
            <input type="number" id="detailQtyInput" class="qty-input" value="1" min="1" max="20" readonly>
            <button class="qty-btn" onclick="stepDetailQty(1)">+</button>
          </div>

          <button class="btn btn-primary btn-lg" onclick="addDetailToCart(false)">
            🛒 Add to Cart
          </button>
          <button class="btn btn-accent btn-lg" onclick="addDetailToCart(true)">
            ⚡ Buy Now
          </button>
        </div>

        <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--border-light);">
          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 6px;">🌱 Ingredients & Heritage Recipe:</h4>
          <p style="font-size: 13px; color: var(--text-muted);">${prod.ingredients}</p>
        </div>
      </div>
    </div>
  `;
}

function setDetailWeight(weight, price, origPrice, elem) {
  document.querySelectorAll('.detail-info .weight-pill').forEach(p => p.classList.remove('selected'));
  elem.classList.add('selected');

  AppState.activeWeightOption = { weight, price, originalPrice: origPrice };
  document.getElementById('detailPriceDisplay').textContent = `₹${price}`;
  if (origPrice) {
    document.getElementById('detailOrigPriceDisplay').textContent = `₹${origPrice}`;
  }
}

function stepDetailQty(delta) {
  const input = document.getElementById('detailQtyInput');
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > 25) val = 25;
  input.value = val;
}

function addDetailToCart(buyNow = false) {
  if (!AppState.selectedProduct || !AppState.activeWeightOption) return;

  const qty = parseInt(document.getElementById('detailQtyInput')?.value || 1);
  addToCart(AppState.selectedProduct, AppState.activeWeightOption, qty);

  if (buyNow) {
    navigateTo('checkout');
  } else {
    showToast(`Added ${qty} × ${AppState.selectedProduct.name} (${AppState.activeWeightOption.weight}) to cart!`);
  }
}

// ==========================================================================
// CART OPERATIONS
// ==========================================================================
function quickAddToCart(productId, event) {
  event.stopPropagation();
  const prod = AppState.products.find(p => p.id === productId);
  if (!prod) return;

  const card = event.target.closest('.product-card');
  const selectedWeight = card?.dataset.selectedWeight || prod.weights[0].weight;
  const weightObj = prod.weights.find(w => w.weight === selectedWeight) || prod.weights[0];

  addToCart(prod, weightObj, 1);
  showToast(`Added ${prod.name} (${weightObj.weight}) to your cart!`);
}

function addToCart(product, weightObj, qty = 1) {
  const existingIdx = AppState.cart.findIndex(
    item => item.id === product.id && item.weight === weightObj.weight
  );

  if (existingIdx >= 0) {
    AppState.cart[existingIdx].qty += qty;
  } else {
    AppState.cart.push({
      id: product.id,
      name: product.name,
      emoji: product.emoji,
      image: product.image || null,
      weight: weightObj.weight,
      price: weightObj.price,
      qty: qty
    });
  }

  saveCart();
  updateCartBadge();
}

function updateCartQty(index, delta) {
  if (!AppState.cart[index]) return;
  AppState.cart[index].qty += delta;

  if (AppState.cart[index].qty <= 0) {
    AppState.cart.splice(index, 1);
  }

  saveCart();
  renderCartView();
  updateCartBadge();
}

function removeCartItem(index) {
  AppState.cart.splice(index, 1);
  saveCart();
  renderCartView();
  updateCartBadge();
  showToast('Item removed from cart', 'error');
}

function clearCart() {
  AppState.cart = [];
  AppState.appliedCoupon = null;
  saveCart();
  renderCartView();
  updateCartBadge();
}

function saveCart() {
  localStorage.setItem('ik_cart', JSON.stringify(AppState.cart));
}

function updateCartBadge() {
  const count = AppState.cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('navCartCount');
  if (badge) badge.textContent = count;
  const mobileBadge = document.getElementById('mobileDrawerCartBadge');
  if (mobileBadge) mobileBadge.textContent = count;
}

function renderCartView() {
  const cartTableBody = document.getElementById('cartTableBody');
  const cartContainer = document.getElementById('cartContainer');
  const emptyCartState = document.getElementById('emptyCartState');
  if (!cartTableBody || !cartContainer) return;

  if (AppState.cart.length === 0) {
    cartContainer.style.display = 'none';
    if (emptyCartState) emptyCartState.style.display = 'block';
    return;
  }

  cartContainer.style.display = 'grid';
  if (emptyCartState) emptyCartState.style.display = 'none';

  cartTableBody.innerHTML = AppState.cart.map((item, idx) => {
    const itemThumbHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
      : item.emoji;

    return `
      <tr class="cart-item-row">
        <td>
          <div class="cart-prod-cell">
            <div class="cart-prod-img">${itemThumbHtml}</div>
            <div>
              <div class="cart-prod-title">${item.name}</div>
              <div class="cart-prod-meta">Pack Size: <strong>${item.weight}</strong></div>
            </div>
          </div>
        </td>
        <td><strong>₹${item.price}</strong></td>
        <td>
          <div class="qty-stepper" style="height: 36px;">
            <button class="qty-btn" style="height: 34px; width: 32px;" onclick="updateCartQty(${idx}, -1)">−</button>
            <input type="text" class="qty-input" style="height: 34px; width: 40px;" value="${item.qty}" readonly>
            <button class="qty-btn" style="height: 34px; width: 32px;" onclick="updateCartQty(${idx}, 1)">+</button>
          </div>
        </td>
        <td><strong>₹${item.price * item.qty}</strong></td>
        <td>
          <button class="cart-remove-btn" onclick="removeCartItem(${idx})" title="Remove item">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  updateCartSummaryDisplay();
}

// Shipping Zone Calculation based on Selected Indian State
function getShippingRateForState(stateName) {
  const normState = (stateName || '').trim().toLowerCase();
  const zones = AppState.shippingZones || [];

  if (!normState) {
    return {
      isConfigured: false,
      state: stateName,
      zone: 'No state selected',
      rate: 0,
      message: 'Please select a delivery state.'
    };
  }

  // Exact or direct name match with active configured zones
  let matchedZone = zones.find(z => {
    if (z.status && z.status.toLowerCase() === 'inactive') return false;
    const zState = (z.state || z.zone || '').trim().toLowerCase();
    return zState === normState;
  });

  // If not exact match, check if zone explicitly includes the state name
  if (!matchedZone) {
    matchedZone = zones.find(z => {
      if (z.status && z.status.toLowerCase() === 'inactive') return false;
      const zState = (z.state || z.zone || '').trim().toLowerCase();
      return zState.includes(normState) || normState.includes(zState);
    });
  }

  if (matchedZone) {
    const numMatch = (matchedZone.rate || '').toString().match(/\d+/);
    const amount = numMatch ? parseInt(numMatch[0], 10) : (matchedZone.amount !== undefined ? parseInt(matchedZone.amount, 10) : 0);

    return {
      isConfigured: true,
      state: stateName,
      zone: matchedZone.state || matchedZone.zone,
      rate: isNaN(amount) ? 0 : amount,
      status: 'Active',
      message: null
    };
  }

  // State is not configured by Admin
  return {
    isConfigured: false,
    state: stateName,
    zone: stateName,
    rate: 0,
    message: `Delivery is currently not configured for ${stateName}. Please choose another state or contact support.`
  };
}

function updateShippingZoneForState(stateName) {
  AppState.selectedState = stateName || '';
  const zoneInfo = getShippingRateForState(AppState.selectedState);
  AppState.currentZone = zoneInfo;
  AppState.shippingCost = zoneInfo.rate;
  return zoneInfo;
}

/**
 * Renders the #custState dropdown with ONLY Admin-configured Active shipping zones.
 * Called on init, on checkout navigation, and when admin changes storage.
 */
function renderCheckoutStateDropdown() {
  const select = document.getElementById('custState');
  const hint = document.getElementById('custStateHint');
  if (!select) return;

  const activeZones = (AppState.shippingZones || []).filter(z => {
    const s = (z.status || 'Active').trim();
    return s === 'Active';
  });

  const prevVal = AppState.selectedState;

  if (activeZones.length === 0) {
    select.innerHTML = `<option value="">-- No delivery zones currently active --</option>`;
    if (hint) hint.textContent = 'ℹ️ No delivery zones are currently available. Please try again later.';
    AppState.selectedState = '';
    return;
  }

  // Build options from active zones only
  const opts = activeZones.map(z => {
    const name = z.state || z.zone || '';
    const selected = name === prevVal ? ' selected' : '';
    return `<option value="${name}"${selected}>${name}</option>`;
  });

  // If previously selected state is still active, keep it; otherwise pick first
  const stillActive = activeZones.some(z => (z.state || z.zone || '') === prevVal);
  if (!stillActive) {
    // auto-select first active state
    const firstName = activeZones[0].state || activeZones[0].zone || '';
    opts[0] = opts[0].replace(`<option value="${activeZones[0].state || activeZones[0].zone}">`, `<option value="${firstName}" selected>`);
    AppState.selectedState = firstName;
  }

  select.innerHTML = opts.join('');

  // Update hint with shipping charge info
  const zoneInfo = getShippingRateForState(AppState.selectedState);
  if (hint) {
    if (zoneInfo.isConfigured) {
      hint.textContent = `📦 Shipping to ${AppState.selectedState}: ₹${zoneInfo.rate}`;
      hint.style.color = '#059669';
    } else {
      hint.textContent = '';
    }
  }

  updateShippingZoneForState(AppState.selectedState);
}

function onCheckoutStateChange() {
  const stateSelect = document.getElementById('custState');
  if (stateSelect) {
    AppState.selectedState = stateSelect.value;
    updateShippingZoneForState(AppState.selectedState);

    // Refresh hint
    const hint = document.getElementById('custStateHint');
    if (hint) {
      const zoneInfo = getShippingRateForState(AppState.selectedState);
      if (zoneInfo.isConfigured && AppState.selectedState) {
        hint.textContent = `📦 Shipping to ${AppState.selectedState}: ₹${zoneInfo.rate}`;
        hint.style.color = '#059669';
      } else {
        hint.textContent = '';
      }
    }

    renderCheckoutSummary();
  }
}

function calculateCartTotals() {
  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const zoneInfo = getShippingRateForState(AppState.selectedState);
  
  // Apply shipping charge from the configured zone for the state
  let delivery = (zoneInfo.isConfigured && subtotal > 0) ? zoneInfo.rate : 0;

  let discount = 0;
  if (AppState.appliedCoupon) {
    const couponObj = (AppState.coupons || []).find(c => c.code && c.code.toUpperCase() === AppState.appliedCoupon.toUpperCase());
    if (couponObj) {
      if (couponObj.discountType === 'percentage' || couponObj.discountPercent) {
        const pct = couponObj.discountValue || couponObj.discountPercent || 0;
        discount = Math.round((subtotal * pct) / 100);
      } else if (couponObj.discountType === 'flat') {
        discount = Math.min(subtotal, couponObj.discountValue || 0);
      } else if (couponObj.discountType === 'free_shipping' || couponObj.freeShipping) {
        delivery = 0;
      }
    }
  }

  // Estimated Total = Product Subtotal - Coupon Discount + Shipping Charge (NO GST applied)
  const grandTotal = Math.max(0, subtotal - discount) + delivery;

  return {
    subtotal,
    discount,
    delivery,
    grandTotal,
    zoneInfo,
    isConfigured: zoneInfo.isConfigured
  };
}

function updateCartSummaryDisplay() {
  const totals = calculateCartTotals();

  const subtotalElem = document.getElementById('cartSubtotal');
  const deliveryElem = document.getElementById('cartDelivery');
  const discountElem = document.getElementById('cartDiscount');
  const grandTotalElem = document.getElementById('cartGrandTotal');

  if (subtotalElem) subtotalElem.textContent = `₹${totals.subtotal}`;
  if (deliveryElem) {
    deliveryElem.innerHTML = totals.delivery === 0 
      ? `<span class="badge badge-success">FREE</span>` 
      : `₹${totals.delivery}`;
  }
  if (discountElem) discountElem.textContent = totals.discount > 0 ? `-₹${totals.discount}` : `₹0`;
  if (grandTotalElem) grandTotalElem.textContent = `₹${totals.grandTotal}`;
}

function applyCouponCode() {
  const input = document.getElementById('couponCodeInput');
  const code = (input?.value || '').trim().toUpperCase();

  if (!code) {
    showToast('Please enter a coupon code', 'error');
    return;
  }

  const coupon = (AppState.coupons || []).find(c => c.code && c.code.toUpperCase() === code && c.status !== 'Inactive');
  if (!coupon) {
    showToast(`Invalid or inactive coupon code "${code}".`, 'error');
    return;
  }

  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (subtotal < (coupon.minSpend || 0)) {
    showToast(`Order value must be at least ₹${coupon.minSpend} for coupon ${code}`, 'error');
    return;
  }

  AppState.appliedCoupon = code;
  showToast(`Coupon "${code}" applied successfully! 🎉`);
  updateCartSummaryDisplay();
  if (AppState.currentView === 'checkout') {
    renderCheckoutSummary();
  }
}

// ==========================================================================
// CHECKOUT & PAYMENT FLOW
// ==========================================================================
function renderCheckoutSummary() {
  // Sync selected state from dropdown if rendered
  const stateElem = document.getElementById('custState');
  if (stateElem && stateElem.value) {
    AppState.selectedState = stateElem.value;
  }

  const totals = calculateCartTotals();
  const summaryElem = document.getElementById('checkoutSummaryItems');

  if (summaryElem) {
    if (AppState.cart.length === 0) {
      summaryElem.innerHTML = `
        <div style="text-align: center; padding: 24px 0; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🛒</div>
          <p>Your cart is empty.</p>
          <a href="#" onclick="navigateTo('categories'); return false;" class="btn btn-sm btn-outline-primary" style="margin-top: 10px;">Browse Spices & Combos</a>
        </div>
      `;
    } else {
      summaryElem.innerHTML = AppState.cart.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--border-light); font-size: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px;">` : (item.emoji || '🌶️')}</span>
            <div>
              <div style="font-weight: 600; color: var(--text-main); line-height: 1.3;">${item.name}</div>
              <small style="color: var(--text-muted);">${item.qty} × ₹${item.price} &middot; <span style="background: #f1f5f9; padding: 1px 6px; border-radius: 4px;">${item.weight}</span></small>
            </div>
          </div>
          <strong style="color: var(--text-main); font-size: 15px;">₹${item.price * item.qty}</strong>
        </div>
      `).join('');
    }
  }

  // Update Shipping Zone Banner & Delivery Info
  const zone = totals.zoneInfo;
  const banner = document.getElementById('checkoutShippingZoneBanner');
  const zoneBadge = document.getElementById('checkoutZoneNameBadge');
  const zoneDays = document.getElementById('checkoutZoneDays');
  const zoneCarrier = document.getElementById('checkoutZoneCarrier');
  const deliveryLabel = document.getElementById('checkoutDeliveryLabel');
  const payBtn = document.getElementById('placeOrderBtn');

  if (banner) {
    if (zone.isConfigured) {
      banner.style.display = 'block';
      banner.style.background = 'var(--bg-surface-alt, #f8fafc)';
      banner.style.borderColor = 'var(--border-light)';
      if (zoneBadge) {
        zoneBadge.className = 'badge badge-success';
        zoneBadge.textContent = `📍 ${zone.zone} (Shipping: ₹${zone.rate})`;
      }
      if (zoneDays) zoneDays.textContent = 'Standard Ground Delivery';
      if (zoneCarrier) zoneCarrier.textContent = 'All-India Logistics Partner';
    } else {
      banner.style.display = 'block';
      banner.style.background = '#fef2f2';
      banner.style.borderColor = '#fecaca';
      if (zoneBadge) {
        zoneBadge.className = 'badge badge-danger';
        zoneBadge.style.background = '#ef4444';
        zoneBadge.style.color = '#fff';
        zoneBadge.textContent = '⚠️ Not Configured';
      }
      if (zoneDays) zoneDays.innerHTML = `<span style="color: #b91c1c;">${zone.message}</span>`;
      if (zoneCarrier) zoneCarrier.textContent = 'Pending Admin Configuration';
    }
  }

  if (deliveryLabel) {
    deliveryLabel.innerHTML = `Shipping Charge (${AppState.selectedState})`;
  }

  // Populate Coupon dropdown
  const couponSelect = document.getElementById('checkoutCouponSelect');
  if (couponSelect) {
    const activeCoupons = (AppState.coupons || []).filter(c => c.status !== 'Inactive');
    const optionsHtml = [
      '<option value="">-- Choose from Available Coupons --</option>',
      ...activeCoupons.map(c => {
        let desc = c.desc || (c.discountType === 'percentage' ? `${c.discountValue}% OFF` : (c.discountType === 'flat' ? `₹${c.discountValue} OFF` : 'Free Shipping'));
        const selected = AppState.appliedCoupon === c.code ? 'selected' : '';
        return `<option value="${c.code}" ${selected}>🏷️ ${c.code} - ${desc} (Min ₹${c.minSpend || 0})</option>`;
      })
    ].join('');
    couponSelect.innerHTML = optionsHtml;
  }

  // Update Applied Coupon Tag
  const appliedTag = document.getElementById('checkoutAppliedCouponTag');
  const appliedName = document.getElementById('checkoutAppliedCouponName');
  const appliedDesc = document.getElementById('checkoutAppliedCouponDesc');
  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountElem = document.getElementById('checkoutDiscount');

  if (AppState.appliedCoupon) {
    const couponObj = (AppState.coupons || []).find(c => c.code && c.code.toUpperCase() === AppState.appliedCoupon.toUpperCase());
    if (appliedTag) appliedTag.style.display = 'flex';
    if (appliedName) appliedName.textContent = AppState.appliedCoupon;
    if (appliedDesc) appliedDesc.textContent = couponObj?.desc || (totals.discount > 0 ? `Saved ₹${totals.discount}` : 'Free Shipping');
    if (discountRow) discountRow.style.display = 'flex';
    if (discountElem) discountElem.textContent = totals.discount > 0 ? `-₹${totals.discount}` : 'Free Shipping';
  } else {
    if (appliedTag) appliedTag.style.display = 'none';
    if (discountRow) discountRow.style.display = 'none';
  }

  // Subtotal & Delivery
  const subtotalElem = document.getElementById('checkoutSubtotal');
  const deliveryElem = document.getElementById('checkoutDelivery');
  const grandTotalElem = document.getElementById('checkoutGrandTotal');

  if (subtotalElem) subtotalElem.textContent = `₹${totals.subtotal}`;
  if (deliveryElem) {
    if (zone.isConfigured) {
      deliveryElem.innerHTML = totals.delivery === 0
        ? `<span class="badge badge-success">FREE</span>`
        : `₹${totals.delivery}`;
    } else {
      deliveryElem.innerHTML = `<span style="color: #dc2626; font-size: 12px; font-weight: 600;">⚠️ Shipping not configured</span>`;
    }
  }
  if (grandTotalElem) grandTotalElem.textContent = `₹${totals.grandTotal}`;

  // Update Pay Button
  if (payBtn) {
    if (!zone.isConfigured && AppState.cart.length > 0) {
      payBtn.textContent = `Shipping Unconfigured for ${AppState.selectedState}`;
      payBtn.disabled = true;
      payBtn.style.opacity = '0.6';
      payBtn.style.cursor = 'not-allowed';
    } else {
      payBtn.textContent = `Pay ₹${totals.grandTotal} & Place Order`;
      payBtn.disabled = false;
      payBtn.style.opacity = '1';
      payBtn.style.cursor = 'pointer';
    }
  }

  selectPaymentMethod(AppState.activePaymentMethod);
}

function onSelectCheckoutCouponDropdown(code) {
  if (!code) {
    removeCheckoutCoupon();
    return;
  }
  const input = document.getElementById('checkoutCouponInput');
  if (input) input.value = code;
  applyCheckoutCouponCode();
}

function applyCheckoutCouponCode() {
  const input = document.getElementById('checkoutCouponInput');
  const code = (input?.value || '').trim().toUpperCase();

  if (!code) {
    showToast('Please enter or select a coupon code', 'error');
    return;
  }

  const coupon = (AppState.coupons || []).find(c => c.code && c.code.toUpperCase() === code && c.status !== 'Inactive');
  if (!coupon) {
    showToast(`Invalid or inactive coupon code "${code}"`, 'error');
    return;
  }

  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (subtotal < (coupon.minSpend || 0)) {
    showToast(`Minimum order amount of ₹${coupon.minSpend} required for this coupon`, 'error');
    return;
  }

  AppState.appliedCoupon = code;
  showToast(`Coupon "${code}" applied successfully! 🎉`);
  renderCheckoutSummary();
  updateCartSummaryDisplay();
}

function removeCheckoutCoupon() {
  AppState.appliedCoupon = null;
  const input = document.getElementById('checkoutCouponInput');
  if (input) input.value = '';
  const select = document.getElementById('checkoutCouponSelect');
  if (select) select.value = '';
  showToast('Coupon removed');
  renderCheckoutSummary();
  updateCartSummaryDisplay();
}

function selectPaymentMethod(method) {
  AppState.activePaymentMethod = method;
  document.querySelectorAll('.payment-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.method === method);
  });

  document.querySelectorAll('.payment-pane').forEach(p => p.style.display = 'none');
  const activePane = document.getElementById(`pane-${method}`);
  if (activePane) activePane.style.display = 'block';
}

async function handlePlaceOrder(event) {
  if (event) event.preventDefault();

  if (AppState.cart.length === 0) {
    showToast('Your cart is empty! Add products to proceed.', 'error');
    return;
  }

  // Validate fields
  const name = document.getElementById('custName')?.value.trim();
  const phone = document.getElementById('custPhone')?.value.trim();
  const email = document.getElementById('custEmail')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();
  const city = document.getElementById('custCity')?.value.trim();
  const state = document.getElementById('custState')?.value.trim() || AppState.selectedState;
  const pincode = document.getElementById('custPincode')?.value.trim();

  if (!name || !phone || !address || !pincode) {
    showToast('Please fill in all mandatory shipping address fields', 'error');
    return;
  }

  AppState.selectedState = state;
  const totals = calculateCartTotals();

  if (!totals.isConfigured) {
    showToast(`Shipping is not configured for ${state}. Please choose another delivery state.`, 'error');
    return;
  }

  const orderPayload = {
    customer: { name, phone, email, address, city, state, pincode },
    items: AppState.cart.map(item => ({
      name: item.name,
      weight: item.weight,
      qty: item.qty,
      price: item.price
    })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    appliedCoupon: AppState.appliedCoupon || null,
    deliveryFee: totals.delivery,
    shippingZone: totals.zoneInfo.zone,
    tax: 0, // GST removed completely
    totalAmount: totals.grandTotal,
    paymentMethod: AppState.activePaymentMethod.toUpperCase(),
    paymentStatus: AppState.activePaymentMethod === 'cod' ? 'PENDING' : 'PAID',
    status: 'Pending'
  };

  const submitBtn = document.getElementById('placeOrderBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Secure Payment... ⏳';
  }

  try {
    const createdOrder = await Api.createOrder(orderPayload);
    clearCart();
    AppState.appliedCoupon = null;
    showOrderSuccessModal(createdOrder);
  } catch (err) {
    showToast('Failed to process order. Please try again.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = `Place Order`;
    }
  }
}

function showOrderSuccessModal(order) {
  const modal = document.getElementById('orderSuccessModal');
  const detailsBox = document.getElementById('orderSuccessDetails');

  if (detailsBox) {
    detailsBox.innerHTML = `
      <div style="font-size: 15px; margin-bottom: 12px;">
        <strong>Order ID:</strong> <span style="color: var(--primary); font-weight: 800;">${order.id}</span>
      </div>
      <div style="font-size: 14px; margin-bottom: 6px;">
        <strong>Customer:</strong> ${order.customer.name} (${order.customer.phone})
      </div>
      <div style="font-size: 14px; margin-bottom: 6px;">
        <strong>Delivery To:</strong> ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}
      </div>
      <div style="font-size: 14px; margin-bottom: 12px;">
        <strong>Payment Method:</strong> ${order.paymentMethod} &middot; <span class="badge badge-success">${order.paymentStatus}</span>
      </div>
      <div style="border-top: 1px dashed var(--border-light); padding-top: 10px; font-size: 16px; font-weight: 800;">
        Total Paid: ₹${order.totalAmount}
      </div>
    `;
  }

  if (modal) modal.classList.add('active');
}

function closeOrderModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.remove('active');
  navigateTo('home');
}

// ==========================================================================
// WISHLIST & LIVE SEARCH
// ==========================================================================
function toggleWishlist(productId, event) {
  if (event) event.stopPropagation();

  const idx = AppState.wishlist.indexOf(productId);
  if (idx >= 0) {
    AppState.wishlist.splice(idx, 1);
    showToast('Removed from wishlist');
  } else {
    AppState.wishlist.push(productId);
    showToast('Added to your wishlist ❤️');
  }

  localStorage.setItem('ik_wishlist', JSON.stringify(AppState.wishlist));
  updateWishlistBadge();
  renderProductsGrid();
}

function updateWishlistBadge() {
  const badge = document.getElementById('navWishlistCount');
  if (badge) badge.textContent = AppState.wishlist.length;
  const mobileBadge = document.getElementById('mobileDrawerWishlistBadge');
  if (mobileBadge) mobileBadge.textContent = AppState.wishlist.length;
}

function handleSearch(query) {
  query = (query || '').toLowerCase().trim();
  if (!query) {
    renderProductsGrid();
    return;
  }

  navigateTo('categories');
  const grid = document.getElementById('catalogProductsGrid');
  if (!grid) return;

  const results = AppState.products.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.categoryName.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query)
  );

  const countElem = document.getElementById('catalogCount');
  if (countElem) countElem.textContent = `Found ${results.length} items for "${query}"`;

  if (results.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
        <h3>No matching recipes or combos</h3>
        <p style="color: var(--text-muted);">Try searching for "Sambar", "Podi", or "Combo".</p>
      </div>`;
    return;
  }

  grid.innerHTML = results.map(prod => createProductCardHTML(prod)).join('');
}

// ==========================================================================
// EVENT LISTENERS SETUP
// ==========================================================================
function setupEventListeners() {
  // Navigation Links
  document.querySelectorAll('[data-view-target]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.preventDefault();
      const target = elem.getAttribute('data-view-target');
      navigateTo(target);
    });
  });

  // Search Input
  const searchInput = document.getElementById('navSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  // Category Pills
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = card.getAttribute('data-category');
      AppState.activeCategory = cat || 'all';
      navigateTo('categories');
    });
  });

  // Filter Checkboxes in Catalog
  document.querySelectorAll('.filter-weight').forEach(cb => {
    cb.addEventListener('change', () => renderProductsGrid());
  });

  // Sort Select
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => renderProductsGrid());
  }

  // Payment Tabs
  document.querySelectorAll('.payment-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      selectPaymentMethod(tab.dataset.method);
    });
  });

  // Checkout Form Submit
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handlePlaceOrder);
  }
}
