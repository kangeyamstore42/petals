# 🚀 Ilampirai Kitchens — Complete AWS Production Deployment Guide

This guide details how to deploy the **Ilampirai Kitchens** E-Commerce platform (HTML/CSS/JS Frontend, Spring Boot REST Backend, and MongoDB Database) to **Amazon Web Services (AWS)** for high availability, security, and global delivery.

---

## 🏛️ Architecture Overview

```text
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  End Customers  │ ───▶  │   AWS CloudFront CDN   │ ───▶  │     Amazon S3 Bucket   │
│ (Desktop/Mobile)│       │  (HTTPS SSL + Caching) │       │   (HTML/CSS/JS Frontend)│
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
         │
         │ REST API Calls (`/api/*`)
         ▼
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  AWS Application Load  │ ───▶  │  AWS ECS / App Runner  │ ───▶  │  Amazon DocumentDB     │
│       Balancer         │       │ (Spring Boot Docker)   │       │ (MongoDB Compatible)   │
└────────────────────────┘       └────────────────────────┘       └────────────────────────┘
```

---

## 📦 Part 1: Deploying the Frontend to AWS (S3 + CloudFront)

### Step 1.1: Create Amazon S3 Bucket
1. Open the **AWS S3 Console** and click **Create bucket**.
2. Bucket name: `ilampirai-kitchens-storefront` (or unique name).
3. Region: Select your closest region (e.g., `ap-south-1` Mumbai).
4. Uncheck **Block all public access** (for static website hosting).
5. Click **Create bucket**.

### Step 1.2: Enable Static Website Hosting
1. Go to **Properties** -> **Static website hosting** -> Click **Edit**.
2. Select **Enable**.
3. Index document: `index.html`.
4. Error document: `index.html`.
5. Save changes.

### Step 1.3: Upload Frontend Files
Using the AWS CLI:
```bash
cd ilampirai-kitchens/frontend
aws s3 sync . s3://ilampirai-kitchens-storefront/ --acl public-read
```

### Step 1.4: Configure CloudFront CDN with Custom Domain & Free SSL
1. Go to **CloudFront Console** -> **Create distribution**.
2. Origin domain: Select your S3 bucket endpoint.
3. Default cache behavior:
   - Viewer protocol policy: **Redirect HTTP to HTTPS**.
   - Allowed HTTP methods: **GET, HEAD, OPTIONS**.
4. Request a free SSL certificate using **AWS Certificate Manager (ACM)** for your domain (e.g., `ilampiraikitchens.com`).
5. Add Route 53 alias record pointing to CloudFront.

---

## ☕ Part 2: Deploying the Spring Boot Backend to AWS (AWS App Runner or ECS Fargate)

### Option A: Recommended & Easiest — AWS App Runner
AWS App Runner automatically builds and runs containerized applications with zero infrastructure management.

#### 1. Push Backend Image to Amazon ECR (Elastic Container Registry)
```bash
# 1. Login to Amazon ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# 2. Create ECR repository
aws ecr create-repository --repository-name ilampirai-backend --region ap-south-1

# 3. Build & tag Docker image
docker build -t ilampirai-backend ./backend
docker tag ilampirai-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ilampirai-backend:latest

# 4. Push image
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ilampirai-backend:latest
```

#### 2. Create App Runner Service
1. Open **AWS App Runner Console** -> Click **Create service**.
2. Source: **Container registry** -> Select the image in ECR.
3. Port: `8080`.
4. Add Environment Variables:
   - `SPRING_PROFILES_ACTIVE`: `aws`
   - `MONGODB_URI`: `mongodb://<DOCDB_USER>:<PASSWORD>@<DOCDB_HOST>:27017/ilampirai_kitchens_db?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`
5. Click **Deploy**. AWS will provide an automatic HTTPS URL (e.g., `https://xyz123.ap-south-1.awsapprunner.com`).

---

## 🗄️ Part 3: Deploying MongoDB on AWS (Amazon DocumentDB)

Amazon DocumentDB is a fully managed, MongoDB-compatible database service.

1. Go to **Amazon DocumentDB Console** -> **Clusters** -> **Create cluster**.
2. Cluster Identifier: `ilampirai-kitchens-docdb`.
3. Instance class: `db.t3.medium` (or `db.t4g.medium`).
4. Master username: `ilampirai_admin`.
5. Master password: `<STRONG_PASSWORD>`.
6. Attach a VPC and Security Group allowing inbound traffic on port `27017` from your Backend service.
7. Download the Amazon DocumentDB Certificate Authority (CA) cert:
   ```bash
   wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   ```

---

## 🔄 Part 4: Connecting Frontend and Backend

In `frontend/js/api.js`, update `API_BASE_URL` with your live AWS backend URL:
```javascript
// Local development:
// const API_BASE_URL = 'http://localhost:8080/api';

// Live AWS deployment:
const API_BASE_URL = 'https://api.ilampiraikitchens.com/api'; // or App Runner URL
```

Re-sync to S3:
```bash
aws s3 sync ./frontend s3://ilampirai-kitchens-storefront/
```

---

## ⚡ Part 5: One-Command Local Docker Testing

Before deploying to AWS, test the complete multi-tier setup locally:
```bash
docker compose up -d
```
Access in browser:
- **Customer Storefront**: `http://localhost:3000`
- **Merchant Admin Panel**: `http://localhost:3000/admin.html`
- **Spring Boot API**: `http://localhost:8080/api/products`
- **Health Check**: `http://localhost:8080/api/health`
