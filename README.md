# SmartWarehouse 🏗️📦

SmartWarehouse is a full-stack construction material procurement platform featuring role-based portals for **Buyers**, **Dealers**, and **Admins**, with intelligent **automatic order splitting & allocation** based on lowest pricing.

---

## 🌟 Key Features

- **Role-Based Access Control**:
  - 👷 **Buyer**: Create material requests (cement, steel, sand), track live order status, and review dealer quotations.
  - 🚚 **Dealer**: Browse open requests, submit unit price and quantity quotations, and manage sub-order fulfillment (dispatched/delivered).
  - 🛡️ **Admin**: Global platform oversight, manage all orders/quotations, and execute the greedy **Auto-Allocation Algorithm** to split orders across lowest-bidding dealers.
- **Smart Order Splitting Algorithm**:
  - Automatically sorts dealer quotes by price per unit.
  - Greedily allocates available quantities starting from the cheapest supplier until the total order quantity is satisfied.
  - Generates discrete sub-orders for each winning dealer.
- **Real-Time Order Lifecycle**:
  - `Requested` ➔ `Quoted` ➔ `Allocated` ➔ `Dispatched` ➔ `Delivered`

---

## 🛠️ Technology Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React 19, Vite, Tailwind CSS, Radix UI, Lucide Icons, Framer Motion, TanStack Query
- **Backend**: Express 5, TypeScript 5.9, JWT Authentication (`jsonwebtoken` + `bcryptjs`), Pino Logger
- **Database & ORM**: SQLite (`sql.js` WASM engine with automatic file persistence) + Drizzle ORM
- **API Specification**: OpenAPI 3.1 + Orval (automated React Query client generation)

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Seed Demo Data
Pre-populates sample buyers, dealers, admin, and realistic orders:
```bash
pnpm run seed
```

### 3. Start Development Servers
Runs both the API server (`http://localhost:8080`) and Vite frontend (`http://localhost:5173`) concurrently:
```bash
pnpm run dev
```

---

## 🌐 Production Deployment Guide

SmartWarehouse is configured as a **unified full-stack application**. In production, the Express backend automatically serves both the `/api` endpoints and the compiled React frontend single-page application on a single port.

### Option 1: Deploy on Render (Recommended - Free Tier Available)

1. Push your repository to **GitHub** or **GitLab**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
3. Connect your repository.
4. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm run build && pnpm run seed`
   - **Start Command**: `pnpm run start`
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = *(Generate a secure random string)*
     - `DATABASE_URL` = `./db.sqlite`
5. Click **Deploy Web Service**!

*(Alternatively, use the included `render.yaml` Blueprint for 1-click infrastructure deployment)*.

---

### Option 2: Deploy on Railway

1. Install Railway CLI or go to [Railway Dashboard](https://railway.app/).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Add Environment Variables in Railway Settings:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `your-secret-key-here`
   - `PORT` = `8080` (or leave default)
4. Railway will automatically detect the build/start commands and deploy.

---

### Option 3: Deploy with Docker / Fly.io / VPS

Use the production multi-stage `Dockerfile`:

```bash
# Build the Docker image
docker build -t smartwarehouse:latest .

# Run the container
docker run -d -p 8080:8080 -e JWT_SECRET=your-secret-key --name smartwarehouse smartwarehouse:latest
```

For **Fly.io**:
```bash
fly launch
fly deploy
```

---

## 🔑 Demo Accounts

All demo accounts use password: `password123`

| Role | Email | Description |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | Full platform control & Auto-Allocation trigger |
| **Buyer** | `buyer@example.com` | Metro Construction Co. (material purchaser) |
| **Dealer 1** | `dealer1@example.com` | Apex Materials Corp |
| **Dealer 2** | `dealer2@example.com` | BuildPro Supplies Ltd |
| **Dealer 3** | `dealer3@example.com` | Zenith Aggregates Co |

---

## 📜 Available Scripts

- `pnpm run dev` — Run API server and frontend concurrently (development)
- `pnpm run build` — Typecheck and build all workspace packages
- `pnpm run typecheck` — Typecheck all workspace packages with zero errors
- `pnpm run seed` — Reset and populate database with fresh demo data
- `pnpm run test:api` — Run end-to-end backend API integration test
- `pnpm run start` — Start production API server (serves frontend + API)
