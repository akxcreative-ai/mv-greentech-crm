# MV GREENTECH PVT LTD — Production-Ready Glassmorphism CRM

A modern, secure, and scalable CRM platform custom-designed for **MV GREENTECH PVT LTD**, an industrial and manufacturing equipment company. Built with a high-end Glassmorphism aesthetic and architected for independent multi-client access (Web CRM + future Android Application) using a shared versioned REST API (`/api/v1`).

---

## 🏗️ Architecture & Technology Stack

### Frontend (`/frontend`)
- **Framework**: React 19 + TypeScript + Vite 8
- **Design System**: Tailored Glassmorphism (`#0B1220` deep navy canvas, translucent frosted glass cards, subtle borders, `backdrop-blur-xl`, Inter typography)
- **Styling**: Tailwind CSS v4 with custom theme tokens
- **Data & State**: TanStack React Query v5, Context API
- **Forms & Validation**: React Hook Form with Zod schemas
- **Icons & Charts**: Lucide React, Recharts (Area, Bar, Pie charts)
- **Deployment**: Vercel SPA (with `vercel.json` rewrite routing)

### Backend (`/backend`)
- **Runtime**: Node.js + TypeScript + Express
- **Database & ORM**: PostgreSQL with Prisma ORM 5.22
- **Authentication**: JWT (JSON Web Tokens) with 24h validity + bcryptjs salted password hashing
- **Security**: Helmet, CORS origin whitelisting, Express Rate Limiting (500 req/15m general, 20 req/15m auth)
- **Documents & Export**: PDFKit (Quotations PDF generation), CSV exporter
- **Deployment**: Vercel Serverless Functions (`/api/index.ts`) or Managed Node.js (Railway / Render / AWS ECS)

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database (local or managed instance such as Neon, Supabase, AWS RDS)

### 1. Backend Setup
```bash
cd mv-greentech-crm/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env to set your PostgreSQL connection string:
# DATABASE_URL="postgresql://user:password@localhost:5432/mv_greentech_crm?schema=public"

# Generate Prisma client
npx prisma generate

# Apply migrations / push schema
npx prisma db push

# Seed default administrator & master catalog
npx tsx prisma/seed.ts

# Start backend server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup
```bash
cd mv-greentech-crm/frontend

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

---

## 🔑 Default Credentials (After Seeding)

| Role | Email | Password | Access Scope |
|------|-------|----------|--------------|
| **Administrator** | `admin@mvgreentech.com` | `Admin@123` | Full system access, User management, Settings, Item Master imports |
| **Director** | `director@mvgreentech.com` | `Director@123` | Company-wide reporting, targets, analytics, high-level oversight |
| **Sales Head** | `saleshead@mvgreentech.com` | `SalesHead@123` | Team assignment, quotation approvals, pipeline monitoring |
| **Salesperson** | `sales@mvgreentech.com` | `Sales@123` | Assigned leads, visits, follow-ups, draft quotations |

---

## 📦 Modules & Capabilities

1. **Dashboard**: 8 Real-time KPI Stat Cards, Sales Performance Area Chart, Lead Status Distribution Pie Chart, Monthly Target vs Achievement Bar Chart, Sales Leaderboard, Upcoming Tasks, and Quick-Action launchpad.
2. **Lead Management**: Complete enquiry lifecycle (`General` -> `Market` -> `Quote Submitted` -> `Won` / `Lost`). Automated unique numbering (`LD-YYYYMMDD-NNN`), ownership reassignment, activity logs (calls, notes, visits), follow-up linkage, CSV export, and multi-field filtering.
3. **Customer Master**: Comprehensive account profiles, multi-contact management, interaction timelines, and associated leads/quotations/orders.
4. **Item Master**: Industrial parts & sensors catalog (preserves standard costs, standard prices, lead times, PPQ, stock levels, supplier codes). Safe CSV bulk import with preview & duplicate prevention.
5. **Quotations**: Line-item builder with Item Master lookup, auto tax/discount calculations, revision tracking, downloadable branded PDF generator (`pdfkit`), and one-click conversion to Confirmed Orders.
6. **Orders**: Confirmed purchase orders pipeline tracking (`Confirmed` -> `In Production` -> `Shipped` -> `Delivered`).
7. **Follow-ups & Visits**: Schedule follow-ups (Today / Upcoming / Overdue buckets) with direct status completion and customer visit notes logging.
8. **Sales Targets & Reports**: Monthly quota tracking per salesperson, Target vs Achievement metrics, Enquiry value by owner, and conversion analytics.
9. **User Management & Settings**: RBAC permissions enforcement, user activation/deactivation, company information, default tax rates, and currency options.

---

## 🌐 Production Deployment Guide (Vercel + Managed PostgreSQL)

### Step 1: Managed PostgreSQL Database (Neon / Supabase / AWS RDS)
1. Provision a PostgreSQL 15+ database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Obtain both the **Pooled Connection String** (for runtime queries, port 6543) and **Direct Connection String** (for migrations, port 5432).

### Step 2: Deploy Backend to Vercel
1. In Vercel, click **Add New Project** and import the GitHub repository.
2. Set **Root Directory** to `backend`.
3. Configure Environment Variables in Vercel:
   - `DATABASE_URL`: Your pooled PostgreSQL connection string.
   - `DIRECT_URL`: Your direct PostgreSQL connection string.
   - `JWT_SECRET`: A secure 64-character random string.
   - `JWT_EXPIRES_IN`: `24h`
   - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app`
   - `NODE_ENV`: `production`
4. The deployment will automatically use `backend/api/index.ts` via the configured `backend/vercel.json`.

### Step 3: Deploy Frontend to Vercel
1. In Vercel, click **Add New Project** and select the same repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Configure Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-domain.vercel.app`
5. Click **Deploy**. Vercel will build the frontend (`dist/`) and configure client-side SPA routing rewrites via `frontend/vercel.json`.

### Step 4: Database Migrations in Production
Run migrations safely from your CI/CD pipeline or admin terminal using the direct connection URL:
```bash
cd backend
npx prisma db push --accept-data-loss=false
npx tsx prisma/seed.ts
```

---

## 📱 Future Android Application Integration

The backend REST API has been strictly decoupled from the web frontend:
- All endpoints are standardized under `/api/v1/`
- Standard JSON response format:
  ```json
  {
    "success": true,
    "data": { ... },
    "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 },
    "error": null
  }
  ```
- Mobile authentication uses the exact same `POST /api/v1/auth/login` Bearer JWT mechanism.
- No separate database is required; both clients access the single centralized PostgreSQL database.
