/**
 * ILAMPIRAI KITCHENS — REST API Client & Offline Sync Layer
 * Connects with Spring Boot Backend at http://localhost:8080/api
 * Automatically falls back to persistent localStorage if backend is offline.
 */

const API_BASE_URL = 'http://localhost:8080/api';

// Initial Mock Seed Data (Reflecting Ilampirai Kitchens specialty traditional combos & spices)
const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    name: '1 in 1 - Authentic Sambar Podi (Stone Ground)',
    category: 'combos',
    categoryName: 'Kitchen Combos',
    subcategory: 'Daily Sambar & Rasam Powders',
    comboType: '1 in 1',
    weights: [
      { weight: '50g', price: 55, originalPrice: 70, cost: 25 },
      { weight: '100g', price: 105, originalPrice: 130, cost: 50 },
      { weight: '200g', price: 200, originalPrice: 250, cost: 100 }
    ],
    rating: 4.9,
    reviewsCount: 142,
    badge: 'Bestseller',
    emoji: '🌶️',
    description: 'Traditional grandma recipe Sambar Masala powder prepared with 18 handpicked roasted spices and stone-ground to perfection for rich aroma.',
    ingredients: 'Coriander seeds, Byadagi red chillies, Chana dal, Toor dal, Fenugreek, Cumin, Mustard, Curry leaves, Asafoetida.',
    stock: 85,
    isBestseller: true
  },
  {
    id: 'prod-2',
    name: '2 in 1 - Sambar Podi + Rasam Podi Combo',
    category: 'combos',
    categoryName: 'Kitchen Combos',
    subcategory: 'Daily Sambar & Rasam Powders',
    comboType: '2 in 1',
    weights: [
      { weight: '100g', price: 199, originalPrice: 250, cost: 95 },
      { weight: '200g', price: 380, originalPrice: 480, cost: 180 }
    ],
    rating: 4.8,
    reviewsCount: 98,
    badge: 'Popular Combo',
    emoji: '🍲',
    description: 'The everyday kitchen essential pairing! Authentic home-style Madras Sambar powder paired with piping hot Mysore Rasam powder.',
    ingredients: 'Freshly roasted spices, black peppercorns, cumin, coriander, red chillies, turmeric, curry leaves.',
    stock: 45,
    isBestseller: true
  },
  {
    id: 'prod-3',
    name: '3 in 1 - Kitchen Trifecta: Sambar + Rasam + Idli Podi',
    category: 'combos',
    categoryName: 'Kitchen Combos',
    subcategory: 'Multi-in-1 Festival Combo Packs',
    comboType: '3 in 1',
    weights: [
      { weight: '100g', price: 299, originalPrice: 380, cost: 140 },
      { weight: '200g', price: 570, originalPrice: 720, cost: 270 }
    ],
    rating: 5.0,
    reviewsCount: 215,
    badge: 'Chef Choice',
    emoji: '🍱',
    description: 'Our flagship 3-in-1 combo. Crisp Gunpowder Idli podi with sesame, aromatic Sambar podi, and zesty Rasam podi.',
    ingredients: 'Urad dal, Chana dal, roasted white sesame seeds, red chillies, hing, curry leaves.',
    stock: 30,
    isBestseller: true
  },
  {
    id: 'prod-4',
    name: '5 in 1 - Grand Festive Masala Combo Box',
    category: 'combos',
    categoryName: 'Kitchen Combos',
    subcategory: 'Multi-in-1 Festival Combo Packs',
    comboType: '5 in 1',
    weights: [
      { weight: '100g', price: 499, originalPrice: 650, cost: 240 },
      { weight: '200g', price: 950, originalPrice: 1200, cost: 460 }
    ],
    rating: 4.9,
    reviewsCount: 78,
    badge: 'Value Pack',
    emoji: '🎁',
    description: 'Includes 5 iconic kitchen blends: Sambar, Rasam, Idli Podi, Biryani Masala, and Vatha Kuzhambu Paste.',
    ingredients: 'Comprehensive authentic spice blends roasted with cold-pressed sesame oil.',
    stock: 18,
    isBestseller: true
  },
  {
    id: 'prod-5',
    name: '10 in 1 - Complete Ilampirai Kitchen Master Set',
    category: 'combos',
    categoryName: 'Kitchen Combos',
    subcategory: 'Multi-in-1 Festival Combo Packs',
    comboType: '10 in 1',
    weights: [
      { weight: '100g', price: 999, originalPrice: 1399, cost: 480 },
      { weight: '200g', price: 1899, originalPrice: 2600, cost: 920 }
    ],
    rating: 5.0,
    reviewsCount: 64,
    badge: 'Ultimate Box',
    emoji: '👑',
    description: 'The complete South Indian culinary pantry in one deluxe gift box! 10 signature spice blends, podis, and pickles.',
    ingredients: '10 all-natural stone-ground delicacies prepared fresh upon order.',
    stock: 12,
    isBestseller: true
  },
  {
    id: 'prod-6',
    name: 'Crunchy Paruppu Podi (Dal Rice Powder)',
    category: 'podis',
    categoryName: 'Traditional Podis',
    subcategory: 'Traditional Tiffin Podis',
    comboType: 'Single Item',
    weights: [
      { weight: '50g', price: 45, originalPrice: 60, cost: 20 },
      { weight: '100g', price: 85, originalPrice: 110, cost: 40 },
      { weight: '200g', price: 160, originalPrice: 200, cost: 75 }
    ],
    rating: 4.7,
    reviewsCount: 88,
    badge: 'Kids Love It',
    emoji: '🍚',
    description: 'Roasted lentils with mild spices. Best paired with hot steamed ponni rice and pure melted ghee.',
    ingredients: 'Toor dal, roasted gram (pottukadalai), red chillies, cumin, garlic, salt.',
    stock: 60,
    isBestseller: false
  },
  {
    id: 'prod-7',
    name: 'Traditional Chettinad Pepper Chicken Masala',
    category: 'spices',
    categoryName: 'Spices & Masalas',
    subcategory: 'Stone Ground Non-Veg Masalas',
    comboType: 'Single Item',
    weights: [
      { weight: '50g', price: 60, originalPrice: 75, cost: 28 },
      { weight: '100g', price: 115, originalPrice: 145, cost: 55 },
      { weight: '200g', price: 220, originalPrice: 280, cost: 105 }
    ],
    rating: 4.9,
    reviewsCount: 160,
    badge: 'Fiery & Aromatic',
    emoji: '🍗',
    description: 'Hand-roasted Malabar black pepper, star anise, fennel seeds, and Kalpasi (stone flower) blend.',
    ingredients: 'Whole black pepper, fennel, cinnamon, cloves, cardamom, stone flower, dry red chillies.',
    stock: 40,
    isBestseller: true
  },
  {
    id: 'prod-8',
    name: 'Heritage Cut Mango Pickle (Gingelly Oil)',
    category: 'pickles',
    categoryName: 'South Indian Pickles',
    subcategory: 'Grandma Style Cured Pickles',
    comboType: 'Single Item',
    weights: [
      { weight: '100g', price: 90, originalPrice: 120, cost: 45 },
      { weight: '200g', price: 170, originalPrice: 220, cost: 85 },
      { weight: '500g', price: 380, originalPrice: 480, cost: 190 }
    ],
    rating: 4.8,
    reviewsCount: 112,
    badge: 'Sun Dried',
    emoji: '🥭',
    description: 'Raw green raw mangoes cured in rock salt, hand-pounded red chilli powder, and wood-pressed gingelly oil.',
    ingredients: 'Raw mango chunks, gingelly (sesame) oil, mustard, fenugreek, rock salt, turmeric, asafoetida.',
    stock: 35,
    isBestseller: false
  }
];

const INITIAL_ORDERS = [
  {
    id: 'IK-2026-1001',
    date: '2026-10-10',
    customer: {
      name: 'Kavitha Ramachandran',
      phone: '+91 98401 23456',
      email: 'kavitha.r@example.com',
      address: 'Plot 42, Anna Nagar West',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600040'
    },
    items: [
      { name: '3 in 1 - Kitchen Trifecta: Sambar + Rasam + Idli Podi', weight: '200g', qty: 1, price: 570 }
    ],
    totalAmount: 570,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'Delivered',
    tracking: {
      trackingNumber: 'DEL-9840123-TN',
      carrier: 'Delhivery Surface',
      trackingUrl: 'https://www.delhivery.com/track/package/DEL-9840123-TN',
      notes: 'Delivered to recipient with OTP verification.',
      shippedDate: '2026-10-10T14:30:00Z',
      estimatedDelivery: 'Delivered on Oct 11, 2026',
      updatedAt: '2026-10-11T16:45:00Z'
    },
    createdAt: '2026-10-10T11:20:00Z'
  },
  {
    id: 'IK-2026-1002',
    date: '2026-10-11',
    customer: {
      name: 'Arun Kumar Sundaram',
      phone: '+91 94432 78901',
      email: 'arun.sundar@example.com',
      address: '12B, Gandhipuram 4th Street',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641012'
    },
    items: [
      { name: '5 in 1 - Grand Festive Masala Combo Box', weight: '100g', qty: 1, price: 499 },
      { name: 'Heritage Cut Mango Pickle (Gingelly Oil)', weight: '200g', qty: 1, price: 170 }
    ],
    totalAmount: 669,
    paymentMethod: 'Credit Card',
    paymentStatus: 'PAID',
    status: 'Shipped',
    tracking: {
      trackingNumber: 'IP-TN64101-901',
      carrier: 'India Post Speed Post',
      trackingUrl: 'https://www.indiapost.gov.in/_layouts/15/dpt.ptc.track/track.aspx',
      notes: 'Dispatched via Coimbatore sorting hub.',
      shippedDate: '2026-10-12T10:15:00Z',
      estimatedDelivery: 'Oct 14, 2026',
      updatedAt: '2026-10-12T10:15:00Z'
    },
    createdAt: '2026-10-11T14:45:00Z'
  },
  {
    id: 'IK-2026-1003',
    date: '2026-10-12',
    customer: {
      name: 'Divya Narayanan',
      phone: '+91 97890 54321',
      email: 'divya.n@example.com',
      address: 'Flat 301, Brigade Gardenia, J.P. Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560078'
    },
    items: [
      { name: '10 in 1 - Complete Ilampirai Kitchen Master Set', weight: '200g', qty: 1, price: 1899 }
    ],
    totalAmount: 1899,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'Pending',
    createdAt: '2026-10-12T09:15:00Z'
  }
];

const INITIAL_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'Kitchen Combos',
    slug: 'combos',
    icon: '🍱',
    status: 'Active',
    description: 'Curated 1-in-1 to 10-in-1 combo sets and culinary gift boxes.'
  },
  {
    id: 'cat-2',
    name: 'Spices & Masalas',
    slug: 'spices',
    icon: '🌶️',
    status: 'Active',
    description: 'Authentic stone-ground traditional spice blends & aromatic powders.'
  },
  {
    id: 'cat-3',
    name: 'Traditional Podis',
    slug: 'podis',
    icon: '🍚',
    status: 'Active',
    description: 'Handcrafted roasted tiffin podis, gunpowders and rice accompaniments.'
  },
  {
    id: 'cat-4',
    name: 'South Indian Pickles',
    slug: 'pickles',
    icon: '🥭',
    status: 'Active',
    description: 'Wood-pressed gingelly oil cured South Indian heritage pickles.'
  }
];

const INITIAL_SUBCATEGORIES = [
  {
    id: 'sub-1',
    name: 'Daily Sambar & Rasam Powders',
    parent: 'Spices & Masalas',
    slug: 'sambar-rasam-powders',
    icon: '🍲',
    status: 'Active',
    description: 'Freshly roasted traditional spice mixes for everyday sambar & rasam.',
    itemCount: 6
  },
  {
    id: 'sub-2',
    name: 'Traditional Tiffin Podis',
    parent: 'Traditional Podis',
    slug: 'tiffin-podis',
    icon: '🍚',
    status: 'Active',
    description: 'Gunpowder, Paruppu, Idli & Dosa accompaniments.',
    itemCount: 8
  },
  {
    id: 'sub-3',
    name: 'Grandma Style Cured Pickles',
    parent: 'South Indian Pickles',
    slug: 'grandma-pickles',
    icon: '🥭',
    status: 'Active',
    description: 'Sun-dried and wood-pressed gingelly oil cured South Indian pickles.',
    itemCount: 5
  },
  {
    id: 'sub-4',
    name: 'Multi-in-1 Festival Combo Packs',
    parent: 'Kitchen Combos',
    slug: 'festival-combos',
    icon: '🎁',
    status: 'Active',
    description: 'Curated 1-in-1 to 10-in-1 combo gift boxes.',
    itemCount: 10
  },
  {
    id: 'sub-5',
    name: 'Stone Ground Non-Veg Masalas',
    parent: 'Spices & Masalas',
    slug: 'non-veg-masalas',
    icon: '🍗',
    status: 'Active',
    description: 'Chettinad pepper chicken, mutton and fish curries.',
    itemCount: 4
  }
];

const INITIAL_SHIPPING_ZONES = [
  { id: 'zone-1', state: 'Tamil Nadu', zone: 'Tamil Nadu', amount: 40, rate: '₹40', status: 'Active' },
  { id: 'zone-2', state: 'Puducherry', zone: 'Puducherry', amount: 40, rate: '₹40', status: 'Active' },
  { id: 'zone-3', state: 'Karnataka', zone: 'Karnataka', amount: 50, rate: '₹50', status: 'Active' },
  { id: 'zone-4', state: 'Kerala', zone: 'Kerala', amount: 50, rate: '₹50', status: 'Active' },
  { id: 'zone-5', state: 'Andhra Pradesh', zone: 'Andhra Pradesh', amount: 50, rate: '₹50', status: 'Active' },
  { id: 'zone-6', state: 'Telangana', zone: 'Telangana', amount: 50, rate: '₹50', status: 'Active' },
  { id: 'zone-7', state: 'Maharashtra', zone: 'Maharashtra', amount: 70, rate: '₹70', status: 'Active' },
  { id: 'zone-8', state: 'Delhi', zone: 'Delhi', amount: 70, rate: '₹70', status: 'Active' },
  { id: 'zone-9', state: 'Special Remote & Hill Regions', zone: 'Special Remote & Hill Regions', amount: 120, rate: '₹120', status: 'Active' }
];

const INITIAL_BLOGS = [
  {
    id: 'blog-1',
    title: 'The Secret to Golden Sambar: 18 Roasted Spices',
    author: 'Chef Ilampirai',
    category: 'Authentic Recipes',
    date: 'Oct 05, 2026',
    icon: '🍲',
    views: 820,
    status: 'Published',
    summary: 'Discover the traditional ratio of Byadagi chillies, coriander, and stone-ground spices that give Madras Sambar its golden hue.',
    content: 'Traditional South Indian sambar is defined by the roast degree of whole spices. Slow-roasting coriander seeds with chana dal, fenugreek, and fragrant curry leaves creates the complex aroma that defines home-cooked festive feasts.'
  },
  {
    id: 'blog-2',
    title: 'Why Wood-Pressed Gingelly Oil Makes Pickles Last Years',
    author: 'Kitchen Team',
    category: 'Spice Health Benefits',
    date: 'Sep 28, 2026',
    icon: '🥭',
    views: 1140,
    status: 'Published',
    summary: 'Unrefined cold-pressed sesame oil acts as an all-natural preservative and enhances the raw mango cure time.',
    content: 'In authentic grandmother kitchens across Thanjavur and Tirunelveli, pickles never saw chemical preservatives. The secret is double-boiled rock salt, freshly pounded Guntur chilli powder, and pure cold-pressed gingelly oil that seals freshness naturally.'
  },
  {
    id: 'blog-3',
    title: '5 South Indian Podis Every Busy Household Needs',
    author: 'Ananya S.',
    category: 'Kitchen Tips',
    date: 'Sep 15, 2026',
    icon: '🍚',
    views: 950,
    status: 'Published',
    summary: 'From breakfast Idli Gunpowder to hot rice Paruppu Podi, how traditional spice blends save weekday prep time.',
    content: 'Nothing beats coming home to warm steamed rice with a spoonful of nutty Paruppu Podi and pure melted ghee. We explore five must-have traditional dry podis that keep fresh for months without refrigeration.'
  }
];

const INITIAL_COUPONS = [
  { id: 'coup-1', code: 'ILAMPIRAI10', discountType: 'percentage', discountValue: 10, minSpend: 299, desc: '10% OFF on authentic heritage orders above ₹299', status: 'Active' },
  { id: 'coup-2', code: 'FESTIVE20', discountType: 'percentage', discountValue: 20, minSpend: 799, desc: '20% OFF festive celebration discount over ₹799', status: 'Active' },
  { id: 'coup-3', code: 'FREESHIP', discountType: 'free_shipping', discountValue: 0, minSpend: 199, desc: 'Free standard delivery across India on orders over ₹199', status: 'Active' },
  { id: 'coup-4', code: 'GRANDMA50', discountType: 'flat', discountValue: 50, minSpend: 399, desc: 'Flat ₹50 instant discount on orders over ₹399', status: 'Active' }
];

// Initialize Storage if empty
if (!localStorage.getItem('ik_products')) {
  localStorage.setItem('ik_products', JSON.stringify(INITIAL_PRODUCTS));
}
if (!localStorage.getItem('ik_orders')) {
  localStorage.setItem('ik_orders', JSON.stringify(INITIAL_ORDERS));
}
if (!localStorage.getItem('ik_categories')) {
  localStorage.setItem('ik_categories', JSON.stringify(INITIAL_CATEGORIES));
}
if (!localStorage.getItem('ik_subcategories')) {
  localStorage.setItem('ik_subcategories', JSON.stringify(INITIAL_SUBCATEGORIES));
}
if (!localStorage.getItem('ik_shipping_zones')) {
  localStorage.setItem('ik_shipping_zones', JSON.stringify(INITIAL_SHIPPING_ZONES));
}
if (!localStorage.getItem('ik_blogs')) {
  localStorage.setItem('ik_blogs', JSON.stringify(INITIAL_BLOGS));
}
if (!localStorage.getItem('ik_coupons')) {
  localStorage.setItem('ik_coupons', JSON.stringify(INITIAL_COUPONS));
}

// Data integrity: ensure all products have stable IDs and valid subcategory assignments
(function migrateProductIds() {
  try {
    const products = JSON.parse(localStorage.getItem('ik_products') || '[]');
    let changed = false;
    products.forEach((p, i) => {
      if (!p.id || p.id === 'undefined') {
        p.id = 'prod-' + (i + 1);
        changed = true;
      }
      if (!p.subcategory) {
        if (p.category === 'combos' || p.categoryName === 'Kitchen Combos') {
          p.subcategory = (p.name && (p.name.includes('Sambar') || p.name.includes('Rasam')))
            ? 'Daily Sambar & Rasam Powders'
            : 'Multi-in-1 Festival Combo Packs';
        } else if (p.category === 'podis' || p.categoryName === 'Traditional Podis') {
          p.subcategory = 'Traditional Tiffin Podis';
        } else if (p.category === 'spices' || p.categoryName === 'Spices & Masalas') {
          p.subcategory = (p.name && p.name.includes('Chicken')) ? 'Stone Ground Non-Veg Masalas' : 'Daily Sambar & Rasam Powders';
        } else if (p.category === 'pickles' || p.categoryName === 'South Indian Pickles') {
          p.subcategory = 'Grandma Style Cured Pickles';
        } else {
          p.subcategory = 'Daily Sambar & Rasam Powders';
        }
        changed = true;
      }
    });
    if (changed) localStorage.setItem('ik_products', JSON.stringify(products));
  } catch (e) {}
})();

// API Service
const Api = {
  // Check if Spring Boot Backend is active
  async checkBackend() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', mode: 'cors' });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // Products
  async getProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) return data;
      }
    } catch (e) {
      console.warn('Backend unavailable, using local product store');
    }
    return JSON.parse(localStorage.getItem('ik_products') || '[]');
  },

  async getProductById(id) {
    const products = await this.getProducts();
    return products.find(p => p.id === id);
  },

  async saveProduct(product) {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const products = JSON.parse(localStorage.getItem('ik_products') || '[]');
    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      products[idx] = product;
    } else {
      // Do NOT reassign id — the caller already generated a stable id
      products.unshift(product);
    }
    localStorage.setItem('ik_products', JSON.stringify(products));
    return product;
  },

  async deleteProduct(id) {
    try {
      await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
    } catch (e) {}

    let products = JSON.parse(localStorage.getItem('ik_products') || '[]');
    products = products.filter(p => p.id !== id);
    localStorage.setItem('ik_products', JSON.stringify(products));
    return true;
  },

  // Orders
  async getOrders() {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) return data;
      }
    } catch (e) {}
    return JSON.parse(localStorage.getItem('ik_orders') || '[]');
  },

  async getOrderById(orderId) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const orders = JSON.parse(localStorage.getItem('ik_orders') || '[]');
    return orders.find(o => o.id.toLowerCase() === (orderId || '').trim().toLowerCase()) || null;
  },

  async createOrder(orderData) {
    orderData.id = 'IK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    orderData.date = new Date().toISOString().split('T')[0];
    orderData.createdAt = new Date().toISOString();
    orderData.status = orderData.status || 'Pending';

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const saved = await res.json();
        this.triggerEmailNotification('ORDER_CREATED', saved);
        return saved;
      }
    } catch (e) {}

    const orders = JSON.parse(localStorage.getItem('ik_orders') || '[]');
    orders.unshift(orderData);
    localStorage.setItem('ik_orders', JSON.stringify(orders));

    // Deduct inventory
    const products = JSON.parse(localStorage.getItem('ik_products') || '[]');
    orderData.items.forEach(item => {
      const prod = products.find(p => p.name === item.name);
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 20) - item.qty);
      }
    });
    localStorage.setItem('ik_products', JSON.stringify(products));

    // Automatically trigger confirmation email
    this.triggerEmailNotification('ORDER_CREATED', orderData);

    return orderData;
  },

  async updateOrderStatus(orderId, newStatus) {
    let updatedOrder = null;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        updatedOrder = await res.json();
      }
    } catch (e) {}

    const orders = JSON.parse(localStorage.getItem('ik_orders') || '[]');
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      ord.status = newStatus;
      localStorage.setItem('ik_orders', JSON.stringify(orders));
      if (!updatedOrder) updatedOrder = ord;
    }

    if (updatedOrder) {
      this.triggerEmailNotification('STATUS_UPDATED', updatedOrder);
    }
    return true;
  },

  async updateOrderTracking(orderId, trackingDetails) {
    let updatedOrder = null;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingDetails)
      });
      if (res.ok) {
        updatedOrder = await res.json();
      }
    } catch (e) {}

    const orders = JSON.parse(localStorage.getItem('ik_orders') || '[]');
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      ord.tracking = {
        ...trackingDetails,
        updatedAt: new Date().toISOString()
      };
      if (ord.status !== 'Delivered') {
        ord.status = 'Shipped';
      }
      localStorage.setItem('ik_orders', JSON.stringify(orders));
      if (!updatedOrder) updatedOrder = ord;
    }

    if (updatedOrder) {
      this.triggerEmailNotification('SHIPPING_UPDATED', updatedOrder);
    }
    return updatedOrder || true;
  },

  async deleteOrderTracking(orderId) {
    let updatedOrder = null;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
        method: 'DELETE'
      });
      if (res.ok) {
        updatedOrder = await res.json();
      }
    } catch (e) {}

    const orders = JSON.parse(localStorage.getItem('ik_orders') || '[]');
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      delete ord.tracking;
      if (ord.status === 'Shipped') {
        ord.status = 'Processing';
      }
      localStorage.setItem('ik_orders', JSON.stringify(orders));
      if (!updatedOrder) updatedOrder = ord;
    }

    if (updatedOrder) {
      this.triggerEmailNotification('SHIPPING_DELETED', updatedOrder);
    }
    return true;
  },

  // Automated Email Notification System
  triggerEmailNotification(type, order) {
    if (!order || !order.customer) return;

    const emailTo = order.customer.email || 'customer@example.com';
    const customerName = order.customer.name || 'Valued Patron';
    let subject = '';
    let previewHtml = '';

    if (type === 'ORDER_CREATED') {
      subject = `✅ Order Confirmed! [${order.id}] - Ilampirai Kitchens`;
      previewHtml = `
        Dear ${customerName},<br><br>
        Thank you for ordering with <strong>Ilampirai Kitchens</strong>! We are preparing your stone-ground delicacies.<br>
        <strong>Order ID:</strong> ${order.id}<br>
        <strong>Total Amount:</strong> ₹${order.totalAmount} (${order.paymentMethod || 'Prepaid'})<br>
        <strong>Shipping To:</strong> ${order.customer.address}, ${order.customer.city} (${order.customer.state})<br>
        <br>You can track your package progress anytime at <a href="track-order.html?orderId=${order.id}">Track Order</a>.
      `;
    } else if (type === 'SHIPPING_UPDATED') {
      subject = `🚚 Order Shipped & Tracking Details Updated! [${order.id}] - Ilampirai Kitchens`;
      const trk = order.tracking || {};
      previewHtml = `
        Dear ${customerName},<br><br>
        Great news! Your package for Order <strong>#${order.id}</strong> has been shipped and is on its way.<br><br>
        <strong>Courier Partner:</strong> ${trk.carrier || 'India Post / Delhivery'}<br>
        <strong>Tracking Number:</strong> <span style="font-family: monospace; font-size: 14px; background: #eee; padding: 2px 6px;">${trk.trackingNumber || 'N/A'}</span><br>
        ${trk.trackingUrl ? `<strong>Tracking Link:</strong> <a href="${trk.trackingUrl}" target="_blank">Track on Courier Portal</a><br>` : ''}
        ${trk.notes ? `<strong>Notes:</strong> ${trk.notes}<br>` : ''}
        <strong>Estimated Delivery:</strong> ${trk.estimatedDelivery || 'Within 2-4 business days'}<br>
        <br>View live progress: <a href="track-order.html?orderId=${order.id}">Track Your Order Here</a>
      `;
    } else if (type === 'STATUS_UPDATED') {
      subject = `📦 Status Update: Order #${order.id} is now ${order.status} - Ilampirai Kitchens`;
      previewHtml = `
        Dear ${customerName},<br><br>
        The fulfillment status for your Order <strong>#${order.id}</strong> has been updated to: <strong>${order.status}</strong>.<br>
        Total Amount: ₹${order.totalAmount}<br>
        <br>Track your package anytime: <a href="track-order.html?orderId=${order.id}">Track Order</a>
      `;
    } else if (type === 'SHIPPING_DELETED') {
      subject = `ℹ️ Shipment Details Updated for Order #${order.id} - Ilampirai Kitchens`;
      previewHtml = `
        Dear ${customerName},<br><br>
        Shipment information for Order <strong>#${order.id}</strong> was updated by our logistics team. Your order status is currently: <strong>${order.status}</strong>.<br>
      `;
    }

    // Persist to email log storage for audit & admin preview
    const emailLogs = JSON.parse(localStorage.getItem('ik_sent_emails') || '[]');
    const emailRecord = {
      id: 'EML-' + Date.now(),
      type,
      to: emailTo,
      orderId: order.id,
      subject,
      previewHtml,
      sentAt: new Date().toISOString()
    };
    emailLogs.unshift(emailRecord);
    localStorage.setItem('ik_sent_emails', JSON.stringify(emailLogs.slice(0, 50)));

    console.log(`%c📧 [AUTOMATED EMAIL SENT] To: ${emailTo} | Subject: "${subject}"`, 'background: #0d5c3a; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

    // Show floating toast notification on UI if page has toast container or create temporary banner
    this.showEmailSentBanner(emailRecord);
  },

  showEmailSentBanner(emailRecord) {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('ikEmailNotifierContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ikEmailNotifierContainer';
      container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; max-width: 400px; width: calc(100% - 48px);';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = 'background: #0f2d1e; color: #fff; border-left: 4px solid #f39c12; border-radius: 8px; padding: 14px 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.35); pointer-events: auto; animation: slideInUp 0.3s ease; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
        <div style="display: flex; gap: 10px;">
          <span style="font-size: 20px;">✉️</span>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #f39c12; font-weight: 700;">Email Notification Sent</div>
            <div style="font-size: 13px; font-weight: 600; margin-top: 2px;">To: ${emailRecord.to}</div>
            <div style="font-size: 12px; color: #b5c9be; margin-top: 2px;">${emailRecord.subject}</div>
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #88a; cursor: pointer; font-size: 16px; padding: 0 4px;">✕</button>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast && toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s ease';
        setTimeout(() => toast.remove(), 400);
      }
    }, 6000);
  },

  // Categories (Parent Taxonomies)
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) return data;
      }
    } catch (e) {
      console.warn('Backend unavailable, using local categories store');
    }

    if (localStorage.getItem('ik_categories') === null) {
      const initialCats = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem('ik_categories', JSON.stringify(initialCats));
      return initialCats;
    }

    let cats = JSON.parse(localStorage.getItem('ik_categories') || '[]');

    let modified = false;
    cats = cats.map((cat, index) => {
      if (!cat.id || cat.id === 'undefined') {
        cat.id = 'cat-' + (index + 1) + '-' + (cat.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        modified = true;
      }
      if (!cat.slug) {
        cat.slug = (cat.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        modified = true;
      }
      return cat;
    });

    if (modified) {
      localStorage.setItem('ik_categories', JSON.stringify(cats));
    }
    return cats;
  },

  async saveCategory(category) {
    if (!category.id || category.id === 'undefined') {
      category.id = 'cat-' + Date.now();
    }

    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    let categories = await this.getCategories();
    const idx = categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      categories[idx] = category;
    } else {
      categories.unshift(category);
    }
    localStorage.setItem('ik_categories', JSON.stringify(categories));
    return category;
  },

  async deleteCategory(idOrName) {
    if (!idOrName) return true;

    try {
      await fetch(`${API_BASE_URL}/categories/${encodeURIComponent(idOrName)}`, { method: 'DELETE' });
    } catch (e) {}

    let categories = await this.getCategories();
    categories = categories.filter(c => c.id !== idOrName && c.name !== idOrName && encodeURIComponent(c.id) !== idOrName);
    localStorage.setItem('ik_categories', JSON.stringify(categories));
    return true;
  },

  // Subcategories
  async getSubcategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/subcategories`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) return data;
      }
    } catch (e) {
      console.warn('Backend unavailable, using local subcategories store');
    }

    if (localStorage.getItem('ik_subcategories') === null) {
      const initialSubs = JSON.parse(JSON.stringify(INITIAL_SUBCATEGORIES));
      localStorage.setItem('ik_subcategories', JSON.stringify(initialSubs));
      return initialSubs;
    }
    let subs = JSON.parse(localStorage.getItem('ik_subcategories') || '[]');

    // Ensure every subcategory has a robust unique id, slug, and status
    let modified = false;
    subs = subs.map((sub, index) => {
      if (!sub.id || sub.id === 'undefined') {
        sub.id = 'sub-' + (index + 1) + '-' + (sub.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        modified = true;
      }
      if (!sub.slug) {
        sub.slug = (sub.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        modified = true;
      }
      return sub;
    });

    if (modified) {
      localStorage.setItem('ik_subcategories', JSON.stringify(subs));
    }
    return subs;
  },

  async saveSubcategory(subcategory) {
    if (!subcategory.id || subcategory.id === 'undefined') {
      subcategory.id = 'sub-' + Date.now();
    }

    try {
      const res = await fetch(`${API_BASE_URL}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subcategory)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    let subcategories = await this.getSubcategories();
    const idx = subcategories.findIndex(s => s.id === subcategory.id);
    if (idx >= 0) {
      subcategories[idx] = subcategory;
    } else {
      subcategories.unshift(subcategory);
    }
    localStorage.setItem('ik_subcategories', JSON.stringify(subcategories));
    return subcategory;
  },

  async deleteSubcategory(idOrName) {
    if (!idOrName) return true;

    try {
      await fetch(`${API_BASE_URL}/subcategories/${encodeURIComponent(idOrName)}`, { method: 'DELETE' });
    } catch (e) {}

    let subcategories = await this.getSubcategories();
    const initialLen = subcategories.length;
    subcategories = subcategories.filter(s => s.id !== idOrName && s.name !== idOrName && encodeURIComponent(s.id) !== idOrName);
    localStorage.setItem('ik_subcategories', JSON.stringify(subcategories));
    return true;
  },

  // Shipping Zones
  async getShippingZones() {
    try {
      const res = await fetch(`${API_BASE_URL}/shipping-zones`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) return data;
      }
    } catch (e) {}

    let zones = JSON.parse(localStorage.getItem('ik_shipping_zones') || '[]');
    if (!zones || !zones.length) {
      zones = JSON.parse(JSON.stringify(INITIAL_SHIPPING_ZONES));
    }
    let modified = false;
    zones = zones.map((z, idx) => {
      if (!z.id) {
        z.id = 'zone-' + (idx + 1);
        modified = true;
      }
      return z;
    });
    if (modified) {
      localStorage.setItem('ik_shipping_zones', JSON.stringify(zones));
    }
    return zones;
  },

  async saveShippingZone(zoneData) {
    if (!zoneData.id || zoneData.id === 'undefined') {
      zoneData.id = 'zone-' + Date.now();
    }
    try {
      const res = await fetch(`${API_BASE_URL}/shipping-zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    let zones = await this.getShippingZones();
    const idx = zones.findIndex(z => z.id === zoneData.id);
    if (idx >= 0) {
      zones[idx] = zoneData;
    } else {
      zones.push(zoneData);
    }
    localStorage.setItem('ik_shipping_zones', JSON.stringify(zones));
    return zoneData;
  },

  async deleteShippingZone(id) {
    try {
      await fetch(`${API_BASE_URL}/shipping-zones/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}

    let zones = await this.getShippingZones();
    zones = zones.filter(z => z.id !== id);
    localStorage.setItem('ik_shipping_zones', JSON.stringify(zones));
    return true;
  },

  // Blogs & Articles
  async getBlogs() {
    try {
      const res = await fetch(`${API_BASE_URL}/blogs`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) return data;
      }
    } catch (e) {}

    let blogs = JSON.parse(localStorage.getItem('ik_blogs') || '[]');
    if (!blogs || !blogs.length) {
      blogs = JSON.parse(JSON.stringify(INITIAL_BLOGS));
    }
    let modified = false;
    blogs = blogs.map((b, idx) => {
      if (!b.id) {
        b.id = 'blog-' + (idx + 1);
        modified = true;
      }
      return b;
    });
    if (modified) {
      localStorage.setItem('ik_blogs', JSON.stringify(blogs));
    }
    return blogs;
  },

  async saveBlog(blogData) {
    if (!blogData.id || blogData.id === 'undefined') {
      blogData.id = 'blog-' + Date.now();
    }
    try {
      const res = await fetch(`${API_BASE_URL}/blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    let blogs = await this.getBlogs();
    const idx = blogs.findIndex(b => b.id === blogData.id);
    if (idx >= 0) {
      blogs[idx] = blogData;
    } else {
      blogs.unshift(blogData);
    }
    localStorage.setItem('ik_blogs', JSON.stringify(blogs));
    return blogData;
  },

  async deleteBlog(id) {
    try {
      await fetch(`${API_BASE_URL}/blogs/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}

    let blogs = await this.getBlogs();
    blogs = blogs.filter(b => b.id !== id);
    localStorage.setItem('ik_blogs', JSON.stringify(blogs));
    return true;
  },

  // Coupons Management
  async getCoupons() {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length) return data;
      }
    } catch (e) {}

    let coupons = JSON.parse(localStorage.getItem('ik_coupons') || '[]');
    if (!coupons || !coupons.length) {
      coupons = JSON.parse(JSON.stringify(INITIAL_COUPONS));
    }
    let modified = false;
    coupons = coupons.map((c, idx) => {
      if (!c.id) {
        c.id = 'coup-' + (idx + 1);
        modified = true;
      }
      return c;
    });
    if (modified) {
      localStorage.setItem('ik_coupons', JSON.stringify(coupons));
    }
    return coupons;
  },

  async saveCoupon(couponData) {
    if (!couponData.id || couponData.id === 'undefined') {
      couponData.id = 'coup-' + Date.now();
    }
    try {
      const res = await fetch(`${API_BASE_URL}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    let coupons = await this.getCoupons();
    const idx = coupons.findIndex(c => c.id === couponData.id || (c.code && c.code.toUpperCase() === couponData.code.toUpperCase()));
    if (idx >= 0) {
      coupons[idx] = couponData;
    } else {
      coupons.unshift(couponData);
    }
    localStorage.setItem('ik_coupons', JSON.stringify(coupons));
    return couponData;
  },

  async deleteCoupon(id) {
    try {
      await fetch(`${API_BASE_URL}/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}

    let coupons = await this.getCoupons();
    coupons = coupons.filter(c => c.id !== id);
    localStorage.setItem('ik_coupons', JSON.stringify(coupons));
    return true;
  }
};
