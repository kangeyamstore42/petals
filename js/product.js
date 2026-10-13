/**
 * ILAMPIRAI KITCHENS — PRODUCT DETAIL PAGE LOGIC (js/product.js)
 * Manages Product View, Image Display, Weight Options, Quantity Stepper,
 * Add to Cart & Buy Now redirects
 */

const ProductState = {
  products: [],
  categories: [],
  selectedProduct: null,
  activeWeightOption: null
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadProductPageData();
  updateCartBadge();
  updateWishlistBadge();
  setupSearchRedirect();
});

async function loadProductPageData() {
  ProductState.products = await Api.getProducts();
  ProductState.categories = await Api.getCategories();

  renderHeaderNavCategories();

  // Get Product ID from URL (?id=prod-1)
  const urlParams = new URLSearchParams(window.location.search);
  const prodId = urlParams.get('id');

  let prod = ProductState.products.find(p => p.id === prodId);
  if (!prod && ProductState.products.length > 0) {
    prod = ProductState.products[0]; // fallback
  }

  if (prod) {
    renderProductDetail(prod);
    renderRelatedProducts(prod);
  } else {
    renderProductNotFound();
  }
}

// Render dynamic categories in Header Nav & Left-side Mobile Drawer
function renderHeaderNavCategories() {
  const navContainer = document.getElementById('mainHeaderNavLinks');
  const mobileCatList = document.getElementById('mobileCategoriesList');

  if (navContainer) {
    navContainer.innerHTML = `
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="catalog.html" class="nav-link">All Products</a></li>
    `;

    (ProductState.categories || []).forEach(cat => {
      const catKey = cat.slug || cat.id;
      const li = document.createElement('li');
      li.innerHTML = `<a href="catalog.html?cat=${catKey}" class="nav-link">${cat.icon || '🍱'} ${cat.name}</a>`;
      navContainer.appendChild(li);
    });
  }

  if (mobileCatList) {
    mobileCatList.innerHTML = (ProductState.categories || []).map(cat => {
      const catKey = cat.slug || cat.id;
      return `
        <li>
          <a class="mobile-nav-item" href="catalog.html?cat=${catKey}" onclick="toggleMobileMenu(false);">
            <span class="m-icon">${cat.icon || '🍱'}</span>
            <span>${cat.name}</span>
          </a>
        </li>
      `;
    }).join('');
  }
}

// Render Main Product Detail View
function renderProductDetail(prod) {
  ProductState.selectedProduct = prod;
  ProductState.activeWeightOption = prod.weights[0];

  document.title = `${prod.name} — Ilampirai Kitchens`;

  const container = document.getElementById('productDetailContent');
  if (!container) return;

  const detailMediaHtml = prod.image
    ? `<img src="${prod.image}" alt="${prod.name}" class="detail-product-img">`
    : `<span>${prod.emoji || '🍱'}</span>`;

  container.innerHTML = `
    <div class="product-detail-view">
      <!-- Media Gallery -->
      <div class="detail-gallery">
        <div class="detail-main-display">
          ${detailMediaHtml}
        </div>
      </div>

      <!-- Info Column -->
      <div class="detail-info">
        <div class="detail-breadcrumbs">
          <a href="index.html">Home</a> / 
          <a href="catalog.html?cat=${prod.category}">${prod.categoryName || 'Kitchen Combos'}</a> / 
          <span>${prod.comboType || prod.name}</span>
        </div>

        <h1 class="detail-title">${prod.name}</h1>

        <div class="product-rating" style="margin-bottom: 16px;">
          <span class="stars" style="font-size: 18px;">★★★★★</span>
          <span style="font-weight: 700; font-size: 16px;">${prod.rating}</span>
          <span class="review-count">(${prod.reviewsCount} verified reviews)</span>
          <span class="badge badge-success" style="margin-left: 10px;">100% Stone Ground</span>
        </div>

        <div class="detail-stock-indicator">
          <span class="stock-dot"></span>
          <span>In Stock (${prod.stock || 25} fresh small-batch packs ready)</span>
        </div>

        <p class="detail-desc">${prod.description}</p>

        <!-- Pack Size / Weight Selection -->
        <div style="margin-bottom: 24px;">
          <label style="font-size: 14px; font-weight: 700; display: block; margin-bottom: 8px;">
            Choose Pack Size / Weight:
          </label>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${prod.weights.map((w, i) => `
              <button class="weight-pill ${i === 0 ? 'selected' : ''}" style="padding: 8px 18px; font-size: 14px;"
                onclick="setDetailWeight('${w.weight}', ${w.price}, ${w.originalPrice || 0}, this)">
                <strong>${w.weight}</strong> — ₹${w.price}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Price Display -->
        <div style="display: flex; align-items: baseline; gap: 14px; margin-bottom: 24px;">
          <span id="detailPriceDisplay" style="font-size: 32px; font-weight: 800; color: var(--primary-hover);">
            ₹${prod.weights[0].price}
          </span>
          <span id="detailOrigPriceDisplay" style="font-size: 18px; color: var(--text-light); text-decoration: line-through;">
            ${prod.weights[0].originalPrice ? `₹${prod.weights[0].originalPrice}` : ''}
          </span>
          <span class="badge badge-orange">Special Deal</span>
        </div>

        <!-- Quantity & CTA Buttons -->
        <div class="detail-cta-row" style="display: flex; gap: 14px; align-items: center; margin-bottom: 32px; flex-wrap: wrap;">
          <div class="qty-stepper">
            <button class="qty-btn" type="button" onclick="stepDetailQty(-1)">−</button>
            <input type="number" id="detailQtyInput" class="qty-input" value="1" min="1" max="25" readonly>
            <button class="qty-btn" type="button" onclick="stepDetailQty(1)">+</button>
          </div>

          <button class="btn btn-primary btn-lg" type="button" onclick="addDetailToCart(false)">
            🛒 Add to Cart
          </button>
          <button class="btn btn-accent btn-lg" type="button" onclick="addDetailToCart(true)">
            ⚡ Buy Now
          </button>
        </div>

        <!-- Ingredients Box -->
        <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--border-light);">
          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 6px;">🌱 Ingredients & Heritage Recipe:</h4>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">${prod.ingredients || 'Natural herbs, unadulterated spices, cold-pressed wood oils.'}</p>
        </div>
      </div>
    </div>
  `;
}

function setDetailWeight(weight, price, origPrice, elem) {
  document.querySelectorAll('.detail-info .weight-pill').forEach(p => p.classList.remove('selected'));
  elem.classList.add('selected');

  ProductState.activeWeightOption = { weight, price, originalPrice: origPrice };
  const priceElem = document.getElementById('detailPriceDisplay');
  const origElem = document.getElementById('detailOrigPriceDisplay');

  if (priceElem) priceElem.textContent = `₹${price}`;
  if (origElem) origElem.textContent = origPrice ? `₹${origPrice}` : '';
}

function stepDetailQty(delta) {
  const input = document.getElementById('detailQtyInput');
  if (!input) return;
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > 25) val = 25;
  input.value = val;
}

// Add to Cart / Buy Now
function addDetailToCart(buyNow = false) {
  if (!ProductState.selectedProduct || !ProductState.activeWeightOption) return;

  const qty = parseInt(document.getElementById('detailQtyInput')?.value || 1);
  const prod = ProductState.selectedProduct;
  const weightObj = ProductState.activeWeightOption;

  let cart = JSON.parse(localStorage.getItem('ik_cart') || '[]');
  const existingIdx = cart.findIndex(
    item => item.id === prod.id && item.weight === weightObj.weight
  );

  const imageSrc = (prod.image && prod.image.length < 2048) ? prod.image : null;

  if (existingIdx >= 0) {
    cart[existingIdx].qty += qty;
  } else {
    cart.push({
      id: prod.id,
      name: prod.name,
      emoji: prod.emoji || '🍱',
      image: imageSrc,
      weight: weightObj.weight,
      price: weightObj.price,
      qty: qty
    });
  }

  saveCartSafely(cart);
  updateCartBadge();

  if (buyNow) {
    window.location.href = 'checkout.html';
  } else {
    showToast(`Added ${qty} × ${prod.name} (${weightObj.weight}) to cart! 🛒`);
  }
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

// Render Related Products
function renderRelatedProducts(currentProd) {
  const container = document.getElementById('relatedProductsGrid');
  if (!container) return;

  const related = ProductState.products
    .filter(p => p.id !== currentProd.id && (p.category === currentProd.category || p.isBestseller))
    .slice(0, 4);

  if (related.length === 0) {
    container.parentElement.style.display = 'none';
    return;
  }

  container.innerHTML = related.map(prod => {
    const defaultWeight = prod.weights[0];
    const mediaHtml = prod.image
      ? `<img src="${prod.image}" alt="${prod.name}" class="product-card-img">`
      : `<div class="product-emoji-icon" style="font-size: 64px;">${prod.emoji || '🍱'}</div>`;

    return `
      <div class="product-card" data-product-id="${prod.id}">
        ${prod.badge ? `<span class="card-badge-tag badge badge-orange">${prod.badge}</span>` : ''}
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
          </div>
          <div class="product-card-footer">
            <div class="price-box">
              <span class="price-current">₹${defaultWeight.price}</span>
            </div>
            <a href="product.html?id=${prod.id}" class="btn btn-primary btn-sm" style="text-decoration: none;">
              View Pack
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderProductNotFound() {
  const container = document.getElementById('productDetailContent');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
        <div style="font-size: 64px; margin-bottom: 16px;">🔍</div>
        <h2>Product Not Found</h2>
        <p style="color: var(--text-muted); margin: 8px 0 24px;">The recipe or spice combo you are looking for does not exist or has been updated.</p>
        <a href="index.html" class="btn btn-primary">Browse All Spices & Combos</a>
      </div>
    `;
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

function updateWishlistBadge() {
  const wishlist = JSON.parse(localStorage.getItem('ik_wishlist') || '[]');
  const badge = document.getElementById('navWishlistCount');
  if (badge) badge.textContent = wishlist.length;
  const mobileBadge = document.getElementById('mobileDrawerWishlistBadge');
  if (mobileBadge) mobileBadge.textContent = wishlist.length;
}

function toggleMobileMenu(isOpen) {
  const drawer = document.getElementById('mobileMenuDrawer');
  const overlay = document.getElementById('mobileMenuOverlay');
  if (drawer) drawer.classList.toggle('active', isOpen);
  if (overlay) overlay.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

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

function setupSearchRedirect() {
  const searchInput = document.getElementById('navSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.location.href = `catalog.html?search=${encodeURIComponent(searchInput.value.trim())}`;
      }
    });
  }
}
