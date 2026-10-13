/**
 * ILAMPIRAI KITCHENS — SHOPPING CART PAGE LOGIC (js/cart.js)
 * Manages Cart Items, Quantity Stepper, Item Removal, Totals & Checkout Redirect
 */

const CartState = {
  cart: JSON.parse(localStorage.getItem('ik_cart') || '[]'),
  categories: []
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCartPageData();
  updateCartBadge();
  updateWishlistBadge();
  setupSearchRedirect();
});

async function loadCartPageData() {
  CartState.categories = await Api.getCategories();
  renderHeaderNavCategories();
  renderCartView();
}

function renderHeaderNavCategories() {
  const navContainer = document.getElementById('mainHeaderNavLinks');
  const mobileCatList = document.getElementById('mobileCategoriesList');

  if (navContainer) {
    navContainer.innerHTML = `
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="catalog.html" class="nav-link">All Products</a></li>
    `;

    (CartState.categories || []).forEach(cat => {
      const catKey = cat.slug || cat.id;
      const li = document.createElement('li');
      li.innerHTML = `<a href="catalog.html?cat=${catKey}" class="nav-link">${cat.icon || '🍱'} ${cat.name}</a>`;
      navContainer.appendChild(li);
    });
  }

  if (mobileCatList) {
    mobileCatList.innerHTML = (CartState.categories || []).map(cat => {
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

function renderCartView() {
  CartState.cart = JSON.parse(localStorage.getItem('ik_cart') || '[]');
  const cartTableBody = document.getElementById('cartTableBody');
  const cartContainer = document.getElementById('cartContainer');
  const emptyCartState = document.getElementById('emptyCartState');

  if (!cartContainer) return;

  if (CartState.cart.length === 0) {
    cartContainer.style.display = 'none';
    if (emptyCartState) emptyCartState.style.display = 'block';
    return;
  }

  cartContainer.style.display = 'grid';
  if (emptyCartState) emptyCartState.style.display = 'none';

  if (cartTableBody) {
    cartTableBody.innerHTML = CartState.cart.map((item, idx) => {
      const itemThumbHtml = item.image
        ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
        : `<span style="font-size: 28px;">${item.emoji || '🍱'}</span>`;

      return `
        <tr class="cart-item-row">
          <td>
            <div class="cart-prod-cell">
              <div class="cart-prod-img">${itemThumbHtml}</div>
              <div>
                <div class="cart-prod-title">
                  <a href="product.html?id=${item.id}" style="color: inherit; text-decoration: none;">${item.name}</a>
                </div>
                <div class="cart-prod-meta">Pack Size: <strong>${item.weight}</strong></div>
              </div>
            </div>
          </td>
          <td><strong>₹${item.price}</strong></td>
          <td>
            <div class="qty-stepper" style="height: 36px;">
              <button class="qty-btn" type="button" style="height: 34px; width: 32px;" onclick="updateCartQty(${idx}, -1)">−</button>
              <input type="text" class="qty-input" style="height: 34px; width: 40px;" value="${item.qty}" readonly>
              <button class="qty-btn" type="button" style="height: 34px; width: 32px;" onclick="updateCartQty(${idx}, 1)">+</button>
            </div>
          </td>
          <td><strong>₹${item.price * item.qty}</strong></td>
          <td>
            <button class="cart-remove-btn" type="button" onclick="removeCartItem(${idx})" title="Remove item">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  updateCartSummaryDisplay();
}

function updateCartQty(index, delta) {
  let cart = JSON.parse(localStorage.getItem('ik_cart') || '[]');
  if (!cart[index]) return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCartSafely(cart);
  CartState.cart = cart;
  renderCartView();
  updateCartBadge();
}

function removeCartItem(index) {
  let cart = JSON.parse(localStorage.getItem('ik_cart') || '[]');
  if (cart[index]) {
    const removedName = cart[index].name;
    cart.splice(index, 1);
    saveCartSafely(cart);
    CartState.cart = cart;
    renderCartView();
    updateCartBadge();
    showToast(`Removed "${removedName}" from cart`, 'error');
  }
}

function clearCart() {
  if (confirm('Are you sure you want to clear your cart?')) {
    saveCartSafely([]);
    CartState.cart = [];
    renderCartView();
    updateCartBadge();
    showToast('Your cart has been cleared');
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

function updateCartSummaryDisplay() {
  const subtotal = CartState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const subtotalElem = document.getElementById('cartSubtotal');
  const grandTotalElem = document.getElementById('cartGrandTotal');
  const itemCountElem = document.getElementById('cartItemCount');

  const totalQty = CartState.cart.reduce((sum, item) => sum + item.qty, 0);

  if (subtotalElem) subtotalElem.textContent = `₹${subtotal}`;
  if (grandTotalElem) grandTotalElem.textContent = `₹${subtotal}`;
  if (itemCountElem) itemCountElem.textContent = `${totalQty} item${totalQty === 1 ? '' : 's'}`;
}

function proceedToCheckout() {
  if (CartState.cart.length === 0) {
    showToast('Your cart is empty! Add products before checking out.', 'error');
    return;
  }
  window.location.href = 'checkout.html';
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
