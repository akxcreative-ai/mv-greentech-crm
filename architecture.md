# Technical Architecture Specification
## MV GREENTECH CRM & ERP

**Document Version:** 1.0  
**Repository:** https://github.com/akxcreative-ai/mv-greentech-crm.git  
**Last Updated:** October 2026

---

## 1. High-Level System Architecture

The MV GREENTECH CRM is built as a decoupled, modern multi-tier cloud application:

```
[ Client Browser / Tablet ]
             │
             │ HTTPS (TLS 1.3)
             ▼
[ Vercel CDN Edge Network ] ─── Hosts React SPA (Static HTML, JS, CSS)
             │
             │ API Rewrites (/v1/*, /api/*)
             ▼
[ Backend Express API (Render / Node.js) ]
             │
             │ Connection Pooling (Prisma Client)
             ▼
[ Neon Serverless PostgreSQL Database ]
```

---

## 2. Technology Stack Breakdown

### 2.1. Frontend Application
- **Runtime & Bundler:** Vite 8.3 + Node.js 20+
- **Framework:** React 19 (Strict Mode, Concurrent Features)
- **Language:** TypeScript 5.8+ (Strict type checking enabled)
- **Styling Engine:** Tailwind CSS v4 (`@tailwindcss/vite` plugin with custom theme variables)
- **Data Fetching & Caching:** TanStack React Query v5 (Optimistic updates, `placeholderData` caching)
- **Form Management:** React Hook Form v7 + Zod v3 validation resolvers
- **Routing:** React Router DOM v7
- **Icons & Graphics:** Lucide React (Clean feather-style enterprise iconography)
- **Charts:** Recharts v3 (Sales analytics, target versus achievement gauges)

### 2.2. Backend REST API
- **Platform:** Node.js 20 LTS (TypeScript execution via `tsx` / `tsc`)
- **HTTP Server:** Express.js 4.21+
- **Database ORM:** Prisma ORM 5.22+
- **Security & Middleware:**
  - `cors`: Allowed origins configured via environment variables.
  - `helmet`: Secure HTTP headers.
  - `express-rate-limit`: Brute-force protection on authentication routes.
  - `jsonwebtoken (JWT)`: Stateless session verification with configurable TTL.
  - `bcryptjs`: Password hashing with salt rounds = 10.
- **Document Engine:** PDFKit + custom HTML table print driver for PDF generation.

### 2.3. Database Architecture (PostgreSQL 15 via Neon.tech)
- **Storage:** Serverless PostgreSQL with auto-scaling storage and point-in-time recovery.
- **Schema Management:** Prisma Schema (`backend/prisma/schema.prisma`) with declarative migrations.
- **Relational Integrity:**
  - Foreign key cascades on dependent line items.
  - `SetNull` safety constraints on `QuotationItem` and `OrderItem` pointing to `Item` to ensure that catalog deletions do not invalidate historical financial ledgers.

---

## 3. Server-Side Pagination & Query Architecture

Every primary list endpoint implements the standard MV GREENTECH pagination contract:

```typescript
// Standard Request Query Parameters
GET /v1/:resource?page=1&limit=10&search=keyword&status=ACTIVE

// Standard Backend Controller Parser
const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
const limit = Math.max(1, Math.min(500, parseInt(req.query.limit as string, 10) || 20));
const skip = (page - 1) * limit;

// Standard Response Payload
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 117,
    "totalPages": 12
  }
}
```

---

## 4. Hosting & Deployment Pipeline

### 4.1. Frontend Hosting (Vercel)
- **Root Directory:** `frontend/`
- **Build Command:** `npm run build` (`tsc -b && vite build`)
- **Output Directory:** `dist`
- **Reverse Proxy:** `frontend/vercel.json` proxies all requests starting with `/v1/` and `/api/` to `https://mv-greentech-crm.onrender.com` to eliminate CORS overhead.

### 4.2. Backend Hosting (Render & Vercel Functions)
- **Root Directory:** `backend/`
- **Build Command:** `npm run build` (`prisma generate && tsc`)
- **Start Command:** `npm run start` (`node dist/server.js`)
- **Environment Variables:**
  - `DATABASE_URL`: Connection string to Neon PostgreSQL.
  - `JWT_SECRET`: Cryptographic token signing key.
  - `PORT`: Service port (default `5000`).
  - `CORS_ORIGIN`: Allowed frontend origins.

---

## 5. Security & Isolation Model

1. **Authentication Token Flow:** Client receives JWT on `/v1/auth/login` → Stores in `localStorage` → Automatically attaches `Authorization: Bearer <token>` via Axios request interceptor (`frontend/src/lib/api.ts`).
2. **Session Termination (401 Interceptor):** Expired or invalidated tokens immediately trigger cleanup and redirect the browser to `/login`.
3. **Password Security:** Passwords are never returned in database select projections (`select: { password: false }`).
