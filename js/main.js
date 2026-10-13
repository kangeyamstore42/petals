/**
 * ILAMPIRAI KITCHENS — MAIN / HOME PAGE LOGIC (js/main.js)
 * Manages Homepage, Hero, Dynamic Category Cards, Featured Bestsellers & Cart Sync
 */

const MainState = {
  products: [],
  categories: [],
  subcategories: [],
  cart: JSON.parse(localStorage.getItem('ik_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('ik_wishlist') || '[]')
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadHomeData();
  setupHomeEventListeners();
  updateCartBadge();
  updateWishlistBadge();
});

// Load Products, Categories, Subcategories
async function loadHomeData() {
  MainState.products = await Api.getProducts();
  MainState.categories = await Api.getCategories();
  MainState.subcategories = await Api.getSubcategories();

  renderHeaderNavCategories();
  renderHomeCategoryCards();
  renderFeaturedCombos();
  initializeRandomHeroProduct();
}

// Random Hero Featured Product Rotation (Changes every 5 minutes)
let heroRotationInterval = null;
let currentHeroProdId = null;

function initializeRandomHeroProduct() {
  if (!MainState.products || !MainState.products.length) return;

  // Pick initial random product
  pickAndDisplayRandomHeroProduct();

  // Clear any existing interval to prevent duplicates
  if (heroRotationInterval) clearInterval(heroRotationInterval);

  // Rotate every 5 minutes (5 * 60 * 1000 ms = 300,000 ms)
  heroRotationInterval = setInterval(() => {
    pickAndDisplayRandomHeroProduct();
  }, 5 * 60 * 1000);
}

function pickAndDisplayRandomHeroProduct() {
  const products = MainState.products;
  if (!products || !products.length) return;

  const box = document.getElementById('heroFeaturedBox');
  const badgeEl = document.getElementById('heroFeatureBadge');
  const mediaEl = document.getElementById('heroFeatureMedia');
  const titleEl = document.getElementById('heroFeatureTitle');
  const descEl = document.getElementById('heroFeatureDesc');
  const priceEl = document.getElementById('heroFeaturePrice');
  const btnEl = document.getElementById('heroFeatureBtn');

  if (!box || !btnEl) return;

  // Pick a random product different from the current one if more than 1 exist
  let pool = products;
  if (products.length > 1 && currentHeroProdId) {
    pool = products.filter(p => p.id !== currentHeroProdId);
  }
  const randomProd = pool[Math.floor(Math.random() * pool.length)];
  if (!randomProd) return;
  currentHeroProdId = randomProd.id;

  // Smooth fade-out and fade-in transition
  box.style.opacity = '0';
  box.style.transform = 'translateY(10px)';

  setTimeout(() => {
    // 1. Badge
    if (badgeEl) {
      badgeEl.textContent = randomProd.badge
        ? `🔥 ${randomProd.badge}`
        : (randomProd.comboType ? `🍱 ${randomProd.comboType}` : '🌿 Authentic Heritage');
    }

    // 2. Media / Image
    if (mediaEl) {
      if (randomProd.image) {
        mediaEl.innerHTML = `<img src="${randomProd.image}" alt="${randomProd.name}" style="max-height: 110px; max-width: 110px; object-fit: contain; border-radius: 12px; margin-bottom: 6px;">`;
      } else {
        mediaEl.textContent = randomProd.emoji || '🍱';
      }
    }

    // 3. Title
    if (titleEl) {
      titleEl.textContent = randomProd.name;
    }

    // 4. Description
    if (descEl) {
      descEl.textContent = randomProd.description
        ? (randomProd.description.length > 75 ? randomProd.description.substring(0, 72) + '...' : randomProd.description)
        : 'Freshly ground authentic South Indian kitchen delicacy.';
    }

    // 5. Price
    const weightOpt = (randomProd.weights && randomProd.weights[0]) || { price: 199, originalPrice: 250 };
    if (priceEl) {
      priceEl.innerHTML = `₹${weightOpt.price} ${weightOpt.originalPrice ? `<span style="font-size: 14px; text-decoration: line-through; opacity: 0.7;">₹${weightOpt.originalPrice}</span>` : ''}`;
    }

    // 6. "Order Now" button linking to that exact product page
    btnEl.href = `product.html?id=${encodeURIComponent(randomProd.id)}`;
    btnEl.textContent = 'Order Now';

    // Fade back in
    box.style.opacity = '1';
    box.style.transform = 'translateY(0)';
  }, 300);
}

// Mobile Menu Drawer Toggle
function toggleMobileMenu(isOpen) {
  const drawer = document.getElementById('mobileMenuDrawer');
  const overlay = document.getElementById('mobileMenuOverlay');
  if (drawer) drawer.classList.toggle('active', isOpen);
  if (overlay) overlay.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

// Render dynamic created categories in Header Nav & Left-side Mobile Drawer
function renderHeaderNavCategories() {
  const navContainer = document.getElementById('mainHeaderNavLinks');
  const mobileCatList = document.getElementById('mobileCategoriesList');

  // Desktop Header Navbar
  if (navContainer) {
    navContainer.innerHTML = `
      <li><a href="index.html" class="nav-link active">Home</a></li>
      <li><a href="catalog.html" class="nav-link">All Products</a></li>
    `;

    (MainState.categories || []).forEach(cat => {
      const catKey = cat.slug || cat.id;
      const li = document.createElement('li');
      li.innerHTML = `<a href="catalog.html?cat=${catKey}" class="nav-link">${cat.icon || '🍱'} ${cat.name}</a>`;
      navContainer.appendChild(li);
    });
  }

  // Mobile Left Drawer Menu
  if (mobileCatList) {
    mobileCatList.innerHTML = (MainState.categories || []).map(cat => {
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

// Dynamically render category cards on Homepage linking to catalog.html?cat=...
function renderHomeCategoryCards() {
  const container = document.getElementById('homeCategoriesGrid');
  if (!container || !MainState.categories || !MainState.categories.length) return;

  container.innerHTML = MainState.categories.map(cat => {
    const catKey = cat.slug || cat.id;
    const subCount = (MainState.subcategories || []).filter(s =>
      s.parent && s.parent.toLowerCase() === (cat.name || '').toLowerCase()
    ).length;
    const countLabel = subCount > 0 ? `${subCount} Subcategories` : (cat.description || 'Authentic Handcrafted');

    return `
      <a href="catalog.html?cat=${catKey}" class="category-card" style="text-decoration: none;">
        <div class="category-icon">${cat.icon || '🍱'}</div>
        <div class="category-name">${cat.name}</div>
        <span class="category-count">${countLabel}</span>
      </a>
    `;
  }).join('');
}

// Render Featured Combos on Homepage
function renderFeaturedCombos() {
  const container = document.getElementById('featuredCombosGrid');
  if (!container) return;

  const combos = MainState.products.filter(p => p.category === 'combos' || p.isBestseller).slice(0, 4);
  container.innerHTML = combos.map(prod => createProductCardHTML(prod)).join('');
}

// Create Card HTML linking to product.html?id=prodId
function createProductCardHTML(prod) {
  const defaultWeight = prod.weights[0];
  const isWishlisted = MainState.wishlist.includes(prod.id);
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
  const prod = MainState.products.find(p => p.id === productId);
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
  MainState.cart = cart;
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
  MainState.wishlist = wishlist;
  updateWishlistBadge();
  renderFeaturedCombos();
}

function updateWishlistBadge() {
  const wishlist = JSON.parse(localStorage.getItem('ik_wishlist') || '[]');
  const badge = document.getElementById('navWishlistCount');
  if (badge) badge.textContent = wishlist.length;
  const mobileBadge = document.getElementById('mobileDrawerWishlistBadge');
  if (mobileBadge) mobileBadge.textContent = wishlist.length;
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

// Search & Event Listeners
function setupHomeEventListeners() {
  const searchInput = document.getElementById('navSearchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        window.location.href = `catalog.html?search=${encodeURIComponent(val)}`;
      }
    });
  }
}
