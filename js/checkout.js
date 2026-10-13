/**
 * ILAMPIRAI KITCHENS — CHECKOUT & PAYMENT LOGIC (js/checkout.js)
 * Manages Address Form, Dynamic Active Shipping Zones, State-based Rates,
 * Coupon Validation, GST-free Total Calculation, Payment Tabs & Order Processing
 */

const CheckoutState = {
  cart: JSON.parse(localStorage.getItem('ik_cart') || '[]'),
  shippingZones: [],
  coupons: [],
  categories: [],
  selectedState: 'Tamil Nadu',
  shippingCost: 40,
  currentZone: null,
  appliedCoupon: null,
  activePaymentMethod: 'upi'
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadCheckoutData();
  setupCheckoutEventListeners();
  updateCartBadge();
  updateWishlistBadge();
  setupSearchRedirect();
});

// Load Zones, Coupons, Categories & Initialize UI
async function loadCheckoutData() {
  CheckoutState.cart = JSON.parse(localStorage.getItem('ik_cart') || '[]');
  CheckoutState.shippingZones = await Api.getShippingZones();
  CheckoutState.coupons = await Api.getCoupons();
  CheckoutState.categories = await Api.getCategories();

  renderHeaderNavCategories();
  renderCheckoutStateDropdown();
  updateShippingZoneForState(CheckoutState.selectedState);
  renderCheckoutSummary();
}

// Cross-tab / same-tab storage sync for shipping zones
window.addEventListener('storage', (e) => {
  if (e.key === 'ik_shipping_zones') {
    const zones = JSON.parse(e.newValue || '[]');
    CheckoutState.shippingZones = zones;
    renderCheckoutStateDropdown();
    updateShippingZoneForState(CheckoutState.selectedState);
    renderCheckoutSummary();
  }
  if (e.key === 'ik_cart') {
    CheckoutState.cart = JSON.parse(e.newValue || '[]');
    renderCheckoutSummary();
    updateCartBadge();
  }
});

function renderHeaderNavCategories() {
  const navContainer = document.getElementById('mainHeaderNavLinks');
  const mobileCatList = document.getElementById('mobileCategoriesList');

  if (navContainer) {
    navContainer.innerHTML = `
      <li><a href="index.html" class="nav-link">Home</a></li>
      <li><a href="catalog.html" class="nav-link">All Products</a></li>
    `;

    (CheckoutState.categories || []).forEach(cat => {
      const catKey = cat.slug || cat.id;
      const li = document.createElement('li');
      li.innerHTML = `<a href="catalog.html?cat=${catKey}" class="nav-link">${cat.icon || '🍱'} ${cat.name}</a>`;
      navContainer.appendChild(li);
    });
  }

  if (mobileCatList) {
    mobileCatList.innerHTML = (CheckoutState.categories || []).map(cat => {
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

/**
 * Shipping Zone Calculation based on Selected Indian State
 */
function getShippingRateForState(stateName) {
  const normState = (stateName || '').trim().toLowerCase();
  const zones = CheckoutState.shippingZones || [];

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

  return {
    isConfigured: false,
    state: stateName,
    zone: stateName,
    rate: 0,
    message: `Delivery is currently not configured for ${stateName}. Please choose another state or contact support.`
  };
}

function updateShippingZoneForState(stateName) {
  CheckoutState.selectedState = stateName || '';
  const zoneInfo = getShippingRateForState(CheckoutState.selectedState);
  CheckoutState.currentZone = zoneInfo;
  CheckoutState.shippingCost = zoneInfo.rate;
  return zoneInfo;
}

/**
 * Renders the #custState dropdown with ONLY Admin-configured Active shipping zones.
 */
function renderCheckoutStateDropdown() {
  const select = document.getElementById('custState');
  const hint = document.getElementById('custStateHint');
  if (!select) return;

  const activeZones = (CheckoutState.shippingZones || []).filter(z => {
    const s = (z.status || 'Active').trim();
    return s === 'Active';
  });

  const prevVal = CheckoutState.selectedState;

  if (activeZones.length === 0) {
    select.innerHTML = `<option value="">-- No delivery zones currently active --</option>`;
    if (hint) hint.textContent = 'ℹ️ No delivery zones are currently available. Please try again later.';
    CheckoutState.selectedState = '';
    return;
  }

  const opts = activeZones.map(z => {
    const name = z.state || z.zone || '';
    const selected = name === prevVal ? ' selected' : '';
    return `<option value="${name}"${selected}>${name}</option>`;
  });

  const stillActive = activeZones.some(z => (z.state || z.zone || '') === prevVal);
  if (!stillActive) {
    const firstName = activeZones[0].state || activeZones[0].zone || '';
    opts[0] = opts[0].replace(`<option value="${firstName}">`, `<option value="${firstName}" selected>`);
    CheckoutState.selectedState = firstName;
  }

  select.innerHTML = opts.join('');

  const zoneInfo = getShippingRateForState(CheckoutState.selectedState);
  if (hint) {
    if (zoneInfo.isConfigured) {
      hint.textContent = `📦 Shipping to ${CheckoutState.selectedState}: ₹${zoneInfo.rate}`;
      hint.style.color = '#059669';
    } else {
      hint.textContent = '';
    }
  }

  updateShippingZoneForState(CheckoutState.selectedState);
}

function onCheckoutStateChange() {
  const stateSelect = document.getElementById('custState');
  if (stateSelect) {
    CheckoutState.selectedState = stateSelect.value;
    updateShippingZoneForState(CheckoutState.selectedState);

    const hint = document.getElementById('custStateHint');
    if (hint) {
      const zoneInfo = getShippingRateForState(CheckoutState.selectedState);
      if (zoneInfo.isConfigured && CheckoutState.selectedState) {
        hint.textContent = `📦 Shipping to ${CheckoutState.selectedState}: ₹${zoneInfo.rate}`;
        hint.style.color = '#059669';
      } else {
        hint.textContent = '';
      }
    }

    renderCheckoutSummary();
  }
}

/**
 * Calculates totals: Subtotal - Discount + Shipping (NO GST)
 */
function calculateCheckoutTotals() {
  const subtotal = CheckoutState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const zoneInfo = getShippingRateForState(CheckoutState.selectedState);

  let delivery = (zoneInfo.isConfigured && subtotal > 0) ? zoneInfo.rate : 0;

  let discount = 0;
  if (CheckoutState.appliedCoupon) {
    const couponObj = (CheckoutState.coupons || []).find(c => c.code && c.code.toUpperCase() === CheckoutState.appliedCoupon.toUpperCase());
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

  // Formula: Estimated Total = Subtotal - Coupon Discount + Shipping (No GST)
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

function renderCheckoutSummary() {
  const stateElem = document.getElementById('custState');
  if (stateElem && stateElem.value) {
    CheckoutState.selectedState = stateElem.value;
  }

  const totals = calculateCheckoutTotals();
  const summaryElem = document.getElementById('checkoutSummaryItems');

  if (summaryElem) {
    if (CheckoutState.cart.length === 0) {
      summaryElem.innerHTML = `
        <div style="text-align: center; padding: 24px 0; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🛒</div>
          <p>Your cart is empty.</p>
          <a href="index.html" class="btn btn-sm btn-secondary" style="margin-top: 10px;">Browse Spices & Combos</a>
        </div>
      `;
    } else {
      summaryElem.innerHTML = CheckoutState.cart.map(item => `
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

  // Shipping Zone Banner
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
      if (zoneDays) zoneDays.textContent = '1 - 3 Days Express Delivery';
      if (zoneCarrier) zoneCarrier.textContent = 'Delhivery / India Post';
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
    deliveryLabel.textContent = `Shipping Charge (${CheckoutState.selectedState || 'Selected State'})`;
  }

  // Available Coupons Dropdown
  const couponSelect = document.getElementById('checkoutCouponSelect');
  if (couponSelect) {
    const activeCoupons = (CheckoutState.coupons || []).filter(c => c.status !== 'Inactive');
    const optionsHtml = [
      '<option value="">-- Choose from Available Coupons --</option>',
      ...activeCoupons.map(c => {
        let desc = c.desc || (c.discountType === 'percentage' ? `${c.discountValue}% OFF` : (c.discountType === 'flat' ? `₹${c.discountValue} OFF` : 'Free Shipping'));
        const selected = CheckoutState.appliedCoupon === c.code ? 'selected' : '';
        return `<option value="${c.code}" ${selected}>🏷️ ${c.code} - ${desc} (Min ₹${c.minSpend || 0})</option>`;
      })
    ].join('');
    couponSelect.innerHTML = optionsHtml;
  }

  // Applied Coupon Tag
  const appliedTag = document.getElementById('checkoutAppliedCouponTag');
  const appliedName = document.getElementById('checkoutAppliedCouponName');
  const appliedDesc = document.getElementById('checkoutAppliedCouponDesc');
  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountElem = document.getElementById('checkoutDiscount');

  if (CheckoutState.appliedCoupon) {
    const couponObj = (CheckoutState.coupons || []).find(c => c.code && c.code.toUpperCase() === CheckoutState.appliedCoupon.toUpperCase());
    if (appliedTag) appliedTag.style.display = 'flex';
    if (appliedName) appliedName.textContent = CheckoutState.appliedCoupon;
    if (appliedDesc) appliedDesc.textContent = couponObj?.desc || (totals.discount > 0 ? `Saved ₹${totals.discount}` : 'Free Shipping');
    if (discountRow) discountRow.style.display = 'flex';
    if (discountElem) discountElem.textContent = totals.discount > 0 ? `-₹${totals.discount}` : 'Free Shipping';
  } else {
    if (appliedTag) appliedTag.style.display = 'none';
    if (discountRow) discountRow.style.display = 'none';
  }

  // Totals Elements
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
    if (!zone.isConfigured && CheckoutState.cart.length > 0) {
      payBtn.textContent = `Shipping Unconfigured for ${CheckoutState.selectedState}`;
      payBtn.disabled = true;
      payBtn.style.opacity = '0.6';
      payBtn.style.cursor = 'not-allowed';
    } else if (CheckoutState.cart.length === 0) {
      payBtn.textContent = `Cart is Empty`;
      payBtn.disabled = true;
      payBtn.style.opacity = '0.6';
    } else {
      payBtn.textContent = `Pay ₹${totals.grandTotal} & Place Order`;
      payBtn.disabled = false;
      payBtn.style.opacity = '1';
      payBtn.style.cursor = 'pointer';
    }
  }

  selectPaymentMethod(CheckoutState.activePaymentMethod);
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

  const coupon = (CheckoutState.coupons || []).find(c => c.code && c.code.toUpperCase() === code && c.status !== 'Inactive');
  if (!coupon) {
    showToast(`Invalid or inactive coupon code "${code}"`, 'error');
    return;
  }

  const subtotal = CheckoutState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (subtotal < (coupon.minSpend || 0)) {
    showToast(`Minimum order amount of ₹${coupon.minSpend} required for coupon ${code}`, 'error');
    return;
  }

  CheckoutState.appliedCoupon = code;
  showToast(`Coupon "${code}" applied successfully! 🎉`);
  renderCheckoutSummary();
}

function removeCheckoutCoupon() {
  CheckoutState.appliedCoupon = null;
  const input = document.getElementById('checkoutCouponInput');
  if (input) input.value = '';
  const select = document.getElementById('checkoutCouponSelect');
  if (select) select.value = '';
  showToast('Coupon removed');
  renderCheckoutSummary();
}

function selectPaymentMethod(method) {
  CheckoutState.activePaymentMethod = method;
  document.querySelectorAll('.payment-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.method === method);
  });

  document.querySelectorAll('.payment-pane').forEach(p => p.style.display = 'none');
  const activePane = document.getElementById(`pane-${method}`);
  if (activePane) activePane.style.display = 'block';
}

async function handlePlaceOrder(event) {
  if (event) event.preventDefault();

  if (CheckoutState.cart.length === 0) {
    showToast('Your cart is empty! Add products to proceed.', 'error');
    return;
  }

  const name = document.getElementById('custName')?.value.trim();
  const phone = document.getElementById('custPhone')?.value.trim();
  const email = document.getElementById('custEmail')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();
  const city = document.getElementById('custCity')?.value.trim();
  const state = document.getElementById('custState')?.value.trim() || CheckoutState.selectedState;
  const pincode = document.getElementById('custPincode')?.value.trim();

  if (!name || !phone || !address || !pincode) {
    showToast('Please fill in all mandatory shipping address fields', 'error');
    return;
  }

  CheckoutState.selectedState = state;
  const totals = calculateCheckoutTotals();

  if (!totals.isConfigured) {
    showToast(`Shipping is not configured for ${state}. Please choose another delivery state.`, 'error');
    return;
  }

  const orderPayload = {
    customer: { name, phone, email, address, city, state, pincode },
    items: CheckoutState.cart.map(item => ({
      name: item.name,
      weight: item.weight,
      qty: item.qty,
      price: item.price
    })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    appliedCoupon: CheckoutState.appliedCoupon || null,
    deliveryFee: totals.delivery,
    shippingZone: totals.zoneInfo.zone,
    tax: 0, // No GST
    totalAmount: totals.grandTotal,
    paymentMethod: CheckoutState.activePaymentMethod.toUpperCase(),
    paymentStatus: CheckoutState.activePaymentMethod === 'cod' ? 'PENDING' : 'PAID',
    status: 'Pending'
  };

  const submitBtn = document.getElementById('placeOrderBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Secure Payment... ⏳';
  }

  try {
    const createdOrder = await Api.createOrder(orderPayload);
    localStorage.setItem('ik_cart', '[]');
    CheckoutState.cart = [];
    CheckoutState.appliedCoupon = null;
    updateCartBadge();
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
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 12px; color: #166534;">
        📧 <strong>Order Confirmation Sent:</strong> A detailed receipt was dispatched to <u>${order.customer.email || 'your email'}</u>. You will also receive automatic updates when the package is shipped!
      </div>
      <div style="border-top: 1px dashed var(--border-light); padding-top: 10px; font-size: 16px; font-weight: 800; color: var(--primary); display: flex; justify-content: space-between; align-items: center;">
        <span>Total Paid: ₹${order.totalAmount}</span>
        <a href="track-order.html?orderId=${order.id}" class="btn btn-sm btn-outline" style="text-decoration: none; font-size: 13px;">
          🚚 Track Order Progress
        </a>
      </div>
    `;
  }

  if (modal) modal.classList.add('active');
}

function closeOrderModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.remove('active');
  window.location.href = 'index.html';
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

function setupCheckoutEventListeners() {
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handlePlaceOrder);
  }

  document.querySelectorAll('.payment-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      selectPaymentMethod(tab.dataset.method);
    });
  });
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
