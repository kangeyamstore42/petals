# 🍱 Ilampirai Kitchens — Full-Stack E-Commerce Platform

A production-ready e-commerce solution for **Ilampirai Kitchens**, featuring authentic South Indian traditional spice combos, gunpowder podis, pickles, and kitchen essentials.

Built with **HTML5, Modern CSS, JavaScript (Frontend)** + **Spring Boot 3 (REST API Backend)** + **MongoDB (Database)** + **AWS (Cloud Infrastructure)**.

---

## 🌟 Highlights & Features

### 🛒 Customer Storefront (`index.html`)
- **Home Page**:
  - Dynamic announcement top bar with promo code (`ILAMPIRAI10`).
  - Hero banner with signature multi-in-1 combo showcases.
  - Interactive categories strip (Combos 1-10 in 1, Spices, Traditional Podis, Pickles).
  - Best sellers and signature festival boxes.
  - Testimonials, culinary guarantees (Stone ground, 100% natural, preservative free).
- **Categories & Catalog Page**:
  - Live weight filter (50g, 100g, 200g, 500g).
  - Dynamic price updates based on selected pack size.
  - Live search with instant debounce and category filtering.
  - Sorting (Price Low-to-High, High-to-Low, Rating, Featured).
- **Product Detail Page**:
  - Dynamic weight selector with real-time price adjustment.
  - Quantity selector stepper `[- 1 +]`.
  - "Add to Cart" and instant "Buy Now" flow.
  - Heritage recipe, ingredients breakdown, and nutritional highlights.
- **Shopping Cart Page**:
  - Quantity controls with live line-item calculations.
  - Coupon code engine (`ILAMPIRAI10` for 10% off, `FESTIVE20` for 20% off, `FREESHIP`).
  - Automatic **Free Shipping** threshold calculation for orders above ₹499.
  - GST tax computation and transparent summary breakdown.
- **Checkout & Payment Simulation Page**:
  - Step 1: Customer shipping and address form with validation.
  - Step 2: Payment options:
    - 📲 **Instant UPI / QR Code**: Interactive simulated QR code for GPay, PhonePe, Paytm, BHIM.
    - 💳 **Credit / Debit Card**: Card details form with live validation.
    - 🏦 **Net Banking**: Bank dropdown selector.
    - 💵 **Cash on Delivery (COD)**.
  - Order confirmation screen with generated unique Order ID (e.g. `IK-2026-XXXX`).
  - Step-by-step visual shipment tracker (`Placed` ➔ `Packing` ➔ `Dispatched` ➔ `Delivered`).
  - One-click **Print / Download Invoice** receipt.

### ⚙️ Merchant Admin Portal (`admin.html`)
Accurately replicates the management dashboard sidebar:
- 📦 **Orders**: Order review, total amounts, date, customer info, and live status modifier (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
- 🛍️ **Products**: Complete product table with weight tiers, stock levels, delete option, and **Add New Product** form.
- 👥 **Users**: Customer profiles with lifetime order counts and spending.
- 📑 **Subcategories**: Taxonomy breakdown and listed item counts.
- 🚚 **Shipping**: Zone-based rates (Tamil Nadu, South India, Rest of India) and delivery estimates.
- 📄 **Blogs**: Recipe articles and view metrics.
- ⚠️ **Inventory Alerts**: Automatic triggers for low-stock products (< 25 units) with **1-click Restock (+50)**.
- 🔥 **Best Sellers & Stock**: Combo ranking, demand level, and inventory velocity.
- ⬇️ **Export CSV**: Export all orders with a single click.

---

## 📂 Project Directory Structure

```text
ilampirai-kitchens/
├── frontend/
│   ├── index.html            # Main Customer Storefront (Home, Catalog, Product, Cart, Checkout)
│   ├── admin.html            # Merchant Admin Dashboard (Matches Sidebar Screenshot)
│   ├── css/
│   │   ├── style.css         # Modern, high-aesthetic culinary design system
│   │   └── admin.css         # Clean administrative styling
│   └── js/
│       ├── api.js            # REST API client with auto-fallback to local store
│       ├── app.js            # Storefront application & checkout controller
│       └── admin.js          # Admin portal logic & orders fulfillment
├── backend/
│   ├── pom.xml               # Maven configuration (Spring Boot 3, MongoDB, Web)
│   ├── Dockerfile            # Multi-stage production container build
│   └── src/main/
│       ├── java/com/ilampiraikitchens/ecommerce/
│       │   ├── IlampiraiKitchensApplication.java
│       │   ├── config/
│       │   │   ├── WebConfig.java            # CORS configuration
│       │   │   └── DataInitializer.java      # Automatic MongoDB seed data
│       │   ├── model/
│       │   │   ├── Product.java
│       │   │   ├── WeightOption.java
│       │   │   ├── Order.java
│       │   │   ├── OrderItem.java
│       │   │   ├── Customer.java
│       │   │   └── Category.java
│       │   ├── repository/
│       │   │   ├── ProductRepository.java
│       │   │   ├── OrderRepository.java
│       │   │   └── CategoryRepository.java
│       │   └── controller/
│       │       ├── ProductController.java    # /api/products
│       │       ├── OrderController.java      # /api/orders
│       │       └── DashboardController.java  # /api/health, /api/stats
│       └── resources/
│           ├── application.properties        # Local MongoDB config
│           └── application-aws.properties    # AWS DocumentDB config
├── docker-compose.yml        # Multi-container orchestration (MongoDB + Backend + Frontend)
├── AWS_DEPLOYMENT_GUIDE.md   # Step-by-step AWS deployment (S3, CloudFront, ECS, DocumentDB)
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. View the Storefront Immediately (Zero Installation)
Simply open `frontend/index.html` in your web browser (Chrome, Edge, Firefox, Safari).
The application is pre-configured with auto-detect fallback:
- If the Spring Boot backend is active at `http://localhost:8080`, it fetches and posts directly to MongoDB.
- If running standalone, it immediately works with client-side persistence and simulated offline storage!

### 2. Run with Docker Compose (Recommended)
Spin up MongoDB, Spring Boot Backend, and Frontend Nginx server in one command:
```bash
docker compose up -d
```
- Storefront: `http://localhost:3000`
- Admin Portal: `http://localhost:3000/admin.html`
- Spring Boot API: `http://localhost:8080/api/products`

### 3. Run Spring Boot Backend Manually
```bash
cd backend
mvn spring-boot:run
```
*(Ensure a local MongoDB instance is running on port 27017 or set `MONGODB_URI` in environment)*

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/stats` | Admin metrics (revenue, order count, stock alerts) |
| `GET` | `/api/products` | Retrieve all products (supports `?category=...`) |
| `GET` | `/api/products/{id}` | Retrieve specific product details |
| `POST` | `/api/products` | Create or update a product |
| `DELETE` | `/api/products/{id}` | Delete product |
| `GET` | `/api/orders` | Retrieve list of all orders |
| `POST` | `/api/orders` | Place a new customer order |
| `PUT` | `/api/orders/{id}/status` | Update fulfillment status (`Pending`, `Processing`, etc.) |
