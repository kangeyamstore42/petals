/**
 * ILAMPIRAI KITCHENS — CATALOG PAGE LOGIC (js/catalog.js)
 * Manages the Complete Spice & Recipe Catalog:
 * Category switching, Subcategories, Weight Filtering, Sorting, Search & Cart integration
 */

const CatalogState = {
  products: [],
  categories: [],
  subcategories: [],
  cart: JSON.parse(localStorage.getItem('ik_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('ik_wishlist') || '[]'),
  activeCategory: 'all',
  activeSubcategory: 'all'
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCatalogData();
  setupCatalogEventListeners();
  updateCartBadge();
  updateWishlistBadge();
  handleUrlParams();
});

// Load Products, Categories, Subcategories
async function loadCatalogData() {
  CatalogState.products = await Api.getProducts();
  CatalogState.categories = await Api.getCategories();
  CatalogState.subcategories = await Api.getSubcategories();

  renderHeaderNavCategories();
  renderCatalogCategoryFilters();
  renderCatalogSubcategoryPills();
  renderProductsGrid();
}

// Handle query params like ?cat=combos or ?search=sambar
function handleUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const cat = urlParams.get('cat');
  const subcat = urlParams.get('subcat');
  const search = urlParams.get('search');

  if (cat) {
    CatalogState.activeCategory = cat;
  }
  if (subcat) {
    CatalogState.activeSubcategory = subcat;
  }
  if (search) {
    const searchInput = document.getElementById('navSearchInput');
    if (searchInput) searchInput.value = search;
    handleSearch(search);
    return;
  }

  renderCatalogCategoryFilters();
  renderCatalogSubcategoryPills();
  renderProductsGrid();
  renderHeaderNavCategories();
}

// Mobile Menu Drawer Toggle
function toggleMobileMenu(isOpen) {
  const drawer = document.getElementById('mobileMenuDrawer');
  const overlay = document.getElementById('mobileMenuOverlay');
  if (drawer) drawer.classList.toggle('active', isOpen);
  if (overlay) overlay.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

// Category & Subcategory Selection
function selectNavCategory(catKey) {
  CatalogState.activeCategory = catKey;
  CatalogState.activeSubcategory = 'all';

  // Update URL search param without reload
  const url = new URL(window.location);
  if (catKey === 'all') {
    url.searchParams.delete('cat');
  } else {
    url.searchParams.set('cat', catKey);
  }
  url.searchParams.delete('subcat');
  window.history.replaceState({}, '', url);

  renderCatalogCategoryFilters();
  renderCatalogSubcategoryPills();
  renderProductsGrid();
  renderHeaderNavCategories();
}

function selectSubcategoryFilter(subcatName) {
  CatalogState.activeSubcategory = subcatName;

  const url = new URL(window.location);
  if (subcatName === 'all') {
    url.searchParams.delete('subcat');
  } else {
    url.searchParams.set('subcat', subcatName);
  }
  window.history.replaceState({}, '', url);

  renderCatalogSubcategoryPills();
  renderProductsGrid();
}

// Render Header Navigation Categories
function renderHeaderNavCategories() {
  const navContainer = document.getElementById('mainHeaderNavLinks');
  const mobileCatList = document.getElementById('mobileCategoriesList');

  if (navContainer) {
    const isAllProd = CatalogState.activeCategory === 'all';

    navContainer.innerHTML = `
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="javascript:void(0)" class="nav-link ${isAllProd ? 'active' : ''}" onclick="selectNavCategory('all')">All Products</a></li>
    `;

    (CatalogState.categories || []).forEach(cat => {
      const catKey = cat.slug || cat.id;
      const isActive = CatalogState.activeCategory === catKey;
      const li = document.createElement('li');
      li.innerHTML = `<a href="javascript:void(0)" class="nav-link ${isActive ? 'active' : ''}" onclick="selectNavCategory('${catKey}')">${cat.icon || '🍱'} ${cat.name}</a>`;
      navContainer.appendChild(li);
    });
  }

  if (mobileCatList) {
    mobileCatList.innerHTML = (CatalogState.categories || []).map(cat => {
      const catKey = cat.slug || cat.id;
      const isActive = CatalogState.activeCategory === catKey;
      return `
        <li>
          <a class="mobile-nav-item ${isActive ? 'active' : ''}" href="javascript:void(0)" onclick="selectNavCategory('${catKey}'); toggleMobileMenu(false);">
            <span class="m-icon">${cat.icon || '🍱'}</span>
            <span>${cat.name}</span>
          </a>
        </li>
      `;
    }).join('');
  }
}

// Render Category filter radios in sidebar
function renderCatalogCategoryFilters() {
  const container = document.getElementById('catalogCategoryFilters');
  if (!container) return;

  const isAll = CatalogState.activeCategory === 'all';
  let html = `
    <label class="filter-checkbox">
      <input type="radio" name="catRadio" value="all" ${isAll ? 'checked' : ''}
        onchange="selectNavCategory('all')">
      All Products
    </label>
  `;

  (CatalogState.categories || []).forEach(cat => {
    const catKey = cat.slug || cat.id;
    const isChecked = CatalogState.activeCategory === catKey;
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

// Render Subcategory filter in sidebar
function renderCatalogSubcategoryPills() {
  const sidebarContainer = document.getElementById('catalogSubcategoryFilters');
  if (!sidebarContainer) return;

  let subsToShow = CatalogState.subcategories || [];
  if (CatalogState.activeCategory !== 'all') {
    const activeCatObj = (CatalogState.categories || []).find(c => (c.slug || c.id) === CatalogState.activeCategory);
    const activeCatName = activeCatObj ? activeCatObj.name.toLowerCase() : CatalogState.activeCategory.toLowerCase();
    const matched = subsToShow.filter(s => s.parent && s.parent.toLowerCase() === activeCatName);
    if (matched.length > 0) subsToShow = matched;
  }

  const isAllSub = !CatalogState.activeSubcategory || CatalogState.activeSubcategory === 'all';
  let sideHtml = `
    <label class="filter-checkbox">
      <input type="radio" name="subcatRadio" value="all" ${isAllSub ? 'checked' : ''}
        onchange="selectSubcategoryFilter('all')">
      All Subcategories
    </label>
  `;

  subsToShow.forEach(sub => {
    const isSubActive = CatalogState.activeSubcategory && CatalogState.activeSubcategory.toLowerCase() === sub.name.toLowerCase();
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

// Render Products Grid
function renderProductsGrid() {
  const grid = document.getElementById('catalogProductsGrid');
  if (!grid) return;

  let filtered = [...CatalogState.products];

  // Category filter
  if (CatalogState.activeCategory !== 'all') {
    const activeCatObj = (CatalogState.categories || []).find(c => (c.slug || c.id) === CatalogState.activeCategory);
    const activeCatName = activeCatObj ? activeCatObj.name.toLowerCase() : CatalogState.activeCategory.toLowerCase();

    filtered = filtered.filter(p => {
      return (
        p.category === CatalogState.activeCategory ||
        (p.categoryName && p.categoryName.toLowerCase() === activeCatName) ||
        (p.categoryName && p.categoryName.toLowerCase() === CatalogState.activeCategory.toLowerCase())
      );
    });
  }

  // Subcategory filter
  if (CatalogState.activeSubcategory && CatalogState.activeSubcategory !== 'all') {
    const targetSub = CatalogState.activeSubcategory.toLowerCase();
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
    let catLabel = 'All Categories';
    if (CatalogState.activeCategory !== 'all') {
      const activeCatObj = (CatalogState.categories || []).find(c => (c.slug || c.id) === CatalogState.activeCategory);
      catLabel = activeCatObj ? activeCatObj.name : CatalogState.activeCategory;
    }
    const subLabel = CatalogState.activeSubcategory && CatalogState.activeSubcategory !== 'all' ? ` &middot; "${CatalogState.activeSubcategory}"` : '';
    countElem.innerHTML = `Showing <strong>${filtered.length}</strong> products in <strong>${catLabel}</strong>${subLabel}`;
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

// Create Card HTML linking to product.html?id=prodId
function createProductCardHTML(prod) {
  const defaultWeight = prod.weights[0];
  const isWishlisted = CatalogState.wishlist.includes(prod.id);
  const mediaHtml = prod.image
    ? `<img src="${prod.image}" alt="${prod.name}" class="product-card-img">`
    : `<div class="product-emoji-icon">${prod.emoji}</div>`;

  return `
    <div class="product-card" data-product-id="${prod.id}">
      ${prod.badge ? `<span class="card-badge-tag badge badge-orange">${prod.badge}</span>` : ''}
      <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${prod.id}', event)">
        ${isWishlisted ? '❤️' : '🤍'}
      </button>

      <a href="product.html?id=${prod.id}" class="product-image-wrap" style="text-decoration: none;">
        ${mediaHtml}
      </a>

      <div class="product-content">
        <span class="product-category-label">${prod.comboType || prod.categoryName}</span>
        <h3 class="product-title">
          <a href="product.html?id=${prod.id}" style="color: inherit; text-decoration: none;">${prod.name}</a>
        </h3>

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

// Quick Add to Cart
function quickAddToCart(productId, event) {
  event.stopPropagation();
  const prod = CatalogState.products.find(p => p.id === productId);
  if (!prod) return;

  const card = event.target.closest('.product-card');
  const selectedWeight = card?.dataset.selectedWeight || prod.weights[0].weight;
  const weightObj = prod.weights.find(w => w.weight === selectedWeight) || prod.weights[0];

  addToCart(prod, weightObj, 1);
  showToast(`Added ${prod.name} (${weightObj.weight}) to your cart! 🛒`);
}

function addToCart(product, weightObj, qty = 1) {
  let cart = JSON.parse(localStorage.getItem('ik_cart') || '[]');
  const existingIdx = cart.findIndex(
    item => item.id === product.id && item.weight === weightObj.weight
  );

  const imageSrc = (product.image && product.image.length < 2048) ? product.image : null;

  if (existingIdx >= 0) {
    cart[existingIdx].qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      emoji: product.emoji,
      image: imageSrc,
      weight: weightObj.weight,
      price: weightObj.price,
      qty: qty
    });
  }

  saveCartSafely(cart);
  CatalogState.cart = cart;
  updateCartBadge();
}

function saveCartSafely(cart) {
  try {
    localStorage.setItem('ik_cart', JSON.stringify(cart));
  } catch (err) {
    console.warn('LocalStorage error, saving lightweight cart:', err);
    try {
      const light = cart.map(item => ({ ...item, image: null }));
      localStorage.setItem('ik_cart', JSON.stringify(light));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('ik_cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('navCartCount');
  if (badge) badge.textContent = count;
  const mobileBadge = document.getElementById('mobileDrawerCartBadge');
  if (mobileBadge) mobileBadge.textContent = count;
}

// Wishlist
function toggleWishlist(productId, event) {
  if (event) event.stopPropagation();

  let wishlist = JSON.parse(localStorage.getItem('ik_wishlist') || '[]');
  const idx = wishlist.indexOf(productId);
  if (idx >= 0) {
    wishlist.splice(idx, 1);
    showToast('Removed from wishlist');
  } else {
    wishlist.push(productId);
    showToast('Added to your wishlist ❤️');
  }

  localStorage.setItem('ik_wishlist', JSON.stringify(wishlist));
  CatalogState.wishlist = wishlist;
  updateWishlistBadge();
  renderProductsGrid();
}

function updateWishlistBadge() {
  const wishlist = JSON.parse(localStorage.getItem('ik_wishlist') || '[]');
  const badge = document.getElementById('navWishlistCount');
  if (badge) badge.textContent = wishlist.length;
  const mobileBadge = document.getElementById('mobileDrawerWishlistBadge');
  if (mobileBadge) mobileBadge.textContent = wishlist.length;
}

// Live Search
function handleSearch(query) {
  query = (query || '').toLowerCase().trim();
  const grid = document.getElementById('catalogProductsGrid');
  if (!grid) return;

  if (!query) {
    renderProductsGrid();
    return;
  }

  const results = CatalogState.products.filter(p =>
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

// Toast
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

// Event Listeners
function setupCatalogEventListeners() {
  const searchInput = document.getElementById('navSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  document.querySelectorAll('.filter-weight').forEach(cb => {
    cb.addEventListener('change', () => renderProductsGrid());
  });

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => renderProductsGrid());
  }
}
