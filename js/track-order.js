/**
 * ILAMPIRAI KITCHENS — Customer Order Tracking Logic
 * Enables customers to search and view their order status, tracking number, courier, and step-by-step progress.
 * Read-only interface for customers.
 */

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Check URL query parameters for ?orderId=IK-...
  const urlParams = new URLSearchParams(window.location.search);
  const orderIdParam = urlParams.get('orderId');
  if (orderIdParam) {
    const input = document.getElementById('orderSearchInput');
    if (input) input.value = orderIdParam;
    trackOrder(orderIdParam);
  }
});

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('ik_cart') || '[]');
  const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const badge = document.getElementById('headerCartBadge');
  const mobileBadge = document.getElementById('mobileDrawerCartBadge');
  if (badge) badge.textContent = totalCount;
  if (mobileBadge) mobileBadge.textContent = totalCount;
}

function toggleMobileMenu(show) {
  const drawer = document.getElementById('mobileMenuDrawer');
  const overlay = document.getElementById('mobileMenuOverlay');
  if (!drawer || !overlay) return;

  if (show) {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function quickTrack(orderId) {
  const input = document.getElementById('orderSearchInput');
  if (input) input.value = orderId;
  trackOrder(orderId);
}

async function handleTrackOrderSubmit(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('orderSearchInput');
  const orderId = (input?.value || '').trim();
  if (!orderId) return;

  trackOrder(orderId);
}

async function trackOrder(orderId) {
  const container = document.getElementById('trackingDetailsContainer');
  const notFound = document.getElementById('trackingNotFoundState');
  const btn = document.getElementById('trackSearchBtn');

  if (btn) btn.innerHTML = '<span>⏳ Searching...</span>';

  try {
    const order = await Api.getOrderById(orderId);

    if (!order) {
      if (container) container.style.display = 'none';
      if (notFound) notFound.style.display = 'block';
      return;
    }

    if (notFound) notFound.style.display = 'none';
    if (container) {
      container.innerHTML = renderTrackingView(order);
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (err) {
    console.error('Error tracking order:', err);
  } finally {
    if (btn) btn.innerHTML = '<span>🔎 Track Order</span>';
  }
}

function renderTrackingView(order) {
  const status = order.status || 'Pending';
  const trk = order.tracking || null;
  const hasTracking = trk && (trk.trackingNumber || trk.carrier);

  // Stepper calculations (4 Steps: Placed -> Processing -> Shipped -> Delivered)
  const steps = [
    { key: 'Pending', label: 'Order Placed', icon: '📝', sub: order.date || 'Received' },
    { key: 'Processing', label: 'Packing & Ground', icon: '🍲', sub: 'Stone-ground freshly' },
    { key: 'Shipped', label: 'Shipped', icon: '🚚', sub: hasTracking ? trk.carrier : 'Handed to Courier' },
    { key: 'Delivered', label: 'Delivered', icon: '✅', sub: status === 'Delivered' ? 'Completed' : 'Expected soon' }
  ];

  let currentStepIdx = 0;
  if (status === 'Processing') currentStepIdx = 1;
  else if (status === 'Shipped') currentStepIdx = 2;
  else if (status === 'Delivered') currentStepIdx = 3;
  else if (status === 'Cancelled') currentStepIdx = -1;

  const progressPercent = currentStepIdx === -1 ? 0 : (currentStepIdx / (steps.length - 1)) * 100;

  return `
    <div class="tracking-result-box">
      <!-- Header -->
      <div class="tracking-result-header">
        <div>
          <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</span>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 4px 0 0;">
            ${order.id}
          </h2>
          <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
            Placed on <strong>${order.date || 'Recently'}</strong> &middot; Payment: <strong>${order.paymentMethod || 'Prepaid'}</strong> (${order.paymentStatus || 'PAID'})
          </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <span style="font-size: 12px; color: #64748b; font-weight: 600;">Current Fulfillment Status</span>
          <div>
            ${getStatusBadgeHtml(status)}
          </div>
        </div>
      </div>

      <!-- Step by Step Shipment Stepper -->
      ${status === 'Cancelled' ? `
        <div style="padding: 28px; text-align: center; background: #fef2f2; border-bottom: 1px solid #fee2e2;">
          <div style="font-size: 32px;">❌</div>
          <h4 style="color: #991b1b; font-size: 18px; margin: 6px 0;">This order has been cancelled</h4>
          <p style="color: #b91c1c; font-size: 13px; margin: 0;">If you have any questions or require assistance, please contact our customer support team.</p>
        </div>
      ` : `
        <div style="padding: 10px 24px 20px;">
          <div class="tracking-stepper">
            <div class="stepper-progress-bar" style="width: calc(${progressPercent}% - 30px);"></div>
            ${steps.map((st, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;
              let itemClass = '';
              if (isActive) itemClass = 'active';
              else if (isCompleted) itemClass = 'completed';

              return `
                <div class="step-item ${itemClass}">
                  <div class="step-icon-circle">
                    ${isCompleted ? '✓' : st.icon}
                  </div>
                  <div class="step-label">${st.label}</div>
                  <div class="step-subtext">${st.sub}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `}

      <!-- Shipment Tracking Information Card -->
      ${hasTracking ? `
        <div class="tracking-shipment-pill">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #dbeafe; display: flex; align-items: center; justify-content: center; font-size: 22px;">
              🚚
            </div>
            <div>
              <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #1e40af; letter-spacing: 0.5px;">
                Logistics Partner: ${trk.carrier || 'Domestic Courier'}
              </div>
              <div style="font-size: 16px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 2px;">
                Tracking Number: ${trk.trackingNumber || 'N/A'}
              </div>
              ${trk.notes ? `<div style="font-size: 13px; color: #475569; margin-top: 4px;">ℹ️ <em>${trk.notes}</em></div>` : ''}
              ${trk.estimatedDelivery ? `<div style="font-size: 12px; color: #059669; font-weight: 600; margin-top: 4px;">🗓️ Estimated Delivery: ${trk.estimatedDelivery}</div>` : ''}
            </div>
          </div>

          <div>
            ${trk.trackingUrl ? `
              <a href="${trk.trackingUrl}" target="_blank" rel="noopener" class="btn btn-primary" style="padding: 10px 18px; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                <span>Track on Carrier Website</span>
                <span>↗</span>
              </a>
            ` : `
              <span style="font-size: 12px; color: #64748b; background: #fff; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1;">
                Dispatched via ${trk.carrier || 'Speed Post'}
              </span>
            `}
          </div>
        </div>
      ` : (status === 'Shipped' ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 20px; margin: 16px 28px; font-size: 13px; color: #92400e;">
          📦 Your order is dispatched. The logistics tracking number will appear here shortly as scanned by the carrier hub.
        </div>
      ` : '')}

      <!-- Order Summary Details Grid -->
      <div style="padding: 20px 28px 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; border-top: 1px solid #f1f5f9;">
        <!-- Shipping Destination -->
        <div>
          <h4 style="font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px;">
            📍 Delivery Address
          </h4>
          <div style="font-size: 14px; color: #1e293b; line-height: 1.6;">
            <strong>${order.customer?.name || 'Customer'}</strong><br>
            ${order.customer?.address || ''}<br>
            ${order.customer?.city || ''}, ${order.customer?.state || 'Tamil Nadu'} - ${order.customer?.pincode || ''}<br>
            <span style="color: #64748b;">Phone:</span> ${order.customer?.phone || 'N/A'}
          </div>
        </div>

        <!-- Ordered Items -->
        <div>
          <h4 style="font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px;">
            🛍️ Package Contents (${order.items?.length || 0} items)
          </h4>
          <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px; color: #334155;">
            ${(order.items || []).map(i => `
              <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f5f9;">
                <span><strong>${i.qty}×</strong> ${i.name} <em style="color: #64748b;">(${i.weight || 'Standard'})</em></span>
                <span style="font-weight: 600;">₹${i.price * i.qty}</span>
              </li>
            `).join('')}
          </ul>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 15px; font-weight: 800; color: var(--primary, #0f5132);">
            <span>Total Paid:</span>
            <span>₹${order.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getStatusBadgeHtml(status) {
  if (status === 'Delivered') {
    return `<span style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px;">✅ Delivered</span>`;
  }
  if (status === 'Shipped') {
    return `<span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px;">🚚 In Transit / Shipped</span>`;
  }
  if (status === 'Processing') {
    return `<span style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px;">📦 Packing & Processing</span>`;
  }
  if (status === 'Cancelled') {
    return `<span style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px;">❌ Cancelled</span>`;
  }
  return `<span style="background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px;">⏳ Order Placed (Pending)</span>`;
}
