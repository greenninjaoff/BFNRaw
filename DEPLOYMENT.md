# Befit Nutrition — Deployment Guide

## Architecture

```
backend/   Express + TypeScript + raw pg → PostgreSQL (Neon or self-hosted)
client/    Next.js (App Router) → port 3000
admin/     Next.js (App Router) → port 3001
```

---

## Features Overview

### Client (Storefront)
- Product catalog with category filter, search, sort (newest/oldest/price)
- Product detail with description, ingredients, variant/flavor selector
- Cart with quantity management
- 3-step checkout: cart → delivery+payment → confirmation
- Promo code validation (live backend check)
- Saved addresses with map picker (OpenStreetMap/Leaflet)
- Saved payment cards
- Order history (active / history tabs) with item images
- Account: edit profile, change password, notifications
- Push notification bell with unread count
- Multi-language: EN / RU / UZ
- Light / dark / system theme
- Conversion funnel tracking (PRODUCT_VIEW, ADD_TO_CART, CHECKOUT_START, ORDER_PLACED, PAYMENT_SUCCESS)

### Admin
- Dashboard with Analytics and Products tabs
- Realtime block: last 48h orders, items sold, revenue, unique buyers + hourly chart
- Filterable charts (Today / 7d / 30d / Year / All time) with correct Tashkent timezone
- Products analytics: per-product revenue, purchases, share %, profit (if costPrice set)
- Conversion funnel with real tracked events and drop-off rates
- Smart insights (period vs period comparisons)
- Order management with status updates, address map link
- User management: search, block/unblock, role change
- Category CRUD
- Promo code management
- Broadcast notifications to all users
- Settings: delivery fee, service fee
- SSE live updates (new orders, status changes)

---

## Local Development

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL database (Neon free tier: https://neon.tech)

### 1. Backend

```bash
cd backend
npm install

# Create .env
cat > .env << 'EOF'
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
JWT_SECRET="dev-secret-change-in-production"
CLIENT_URL="http://localhost:3000"
ADMIN_URL="http://localhost:3001"
EOF

npm run dev
# → http://localhost:5000
# → curl http://localhost:5000/health → {"status":"ok"}
```

### 2. Client

```bash
cd client
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev
# → http://localhost:3000
```

### 3. Admin

```bash
cd admin
npm install --legacy-peer-deps
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
PORT=3001 npm run dev
# → http://localhost:3001
```

### 4. Create admin user

```bash
cd backend
npm run create:admin
# Creates phone: +998901234567 / password: Admin123!
```

---

## Database Migrations

Run automatically on backend startup via `runMigrations()`.

Includes:
- `SavedCard` table
- `PromoCode` table
- `AppSetting` table (seeds delivery_fee=9900, service_fee=4990)
- `AnalyticsEvent` table (conversion funnel tracking)
- `costPrice` column on `ProductFlavor` (profit analytics)
- `type`, `series` columns on `Product`

---

## Seed Data

**Categories** — use the seed file or admin UI:
```bash
cd backend
# The categories.ts seed data is in prisma/seed-data/categories.ts
# Add categories via Admin → Categories page
```

**Products** — must be added via Admin → Products → Add Product  
(No product seed data — add manually with images, variants, cost prices)

**Admin user** — `npm run create:admin` in backend directory

---

## Environment Variables

### backend/.env
```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=<64-char random string for production>
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Optional: persistent uploads folder (survives restarts)
# UPLOAD_DIR=/var/www/befit/uploads
```

### client/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### admin/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Image Uploads

Uploaded images are stored in `backend/uploads/`:
```
backend/uploads/
  products/   ← variant images
  logos/      ← logo files
  icons/      ← icon files
```

**For production:** Set `UPLOAD_DIR` env var to a persistent disk path:
```env
UPLOAD_DIR=/var/www/befit/uploads
```
Without this, uploads are lost on server restart (Render/Railway ephemeral filesystem).

---

## Profit Analytics

To enable profit tracking per product:
1. In Admin → Products → edit a variant
2. Set **Cost Price** (in sum) on each variant
3. Admin Products Analytics tab will show Revenue / Cost / Profit breakdown

---

## Production Deployment

### Recommended Stack
| Component | Service | Cost |
|-----------|---------|------|
| Backend | Railway | ~$5/mo |
| Client | Vercel | Free |
| Admin | Vercel | Free |
| Database | Neon | Free tier |
| Uploads | Railway persistent volume | Included |

### Backend (Railway)
```bash
npm i -g @railway/cli
railway login
cd backend && railway init && railway up
```

Set env vars in Railway dashboard — same as `.env` above with production values.

### Client + Admin (Vercel)
```bash
npm i -g vercel
cd client && vercel
cd admin && vercel
```

Set `NEXT_PUBLIC_API_URL` to your Railway backend URL in Vercel dashboard.

### After deploying
1. Update `CLIENT_URL` and `ADMIN_URL` in backend env to real Vercel URLs
2. Redeploy backend (CORS update)
3. Run `npm run create:admin` against production DB once
4. Add categories and products via admin panel

---

## Payment Integration

Payment method UI exists (Card / Payme / Click). Backend structure is ready.

To activate real payments:

### Payme
```env
PAYME_MERCHANT_ID=your_id
PAYME_SECRET_KEY=your_key
PAYME_TEST=false
```
Implement: `POST /api/payments/payme/callback`

### Click
```env
CLICK_SERVICE_ID=your_id
CLICK_MERCHANT_ID=your_id
CLICK_SECRET_KEY=your_key
```
Implement: `POST /api/payments/click/prepare` and `/confirm`

---

## Post-Deployment Checklist

- [ ] `GET /health` → `{"status":"ok"}`
- [ ] CORS allows client + admin origins
- [ ] JWT_SECRET is a long random string
- [ ] Database migrations ran (check logs on startup)
- [ ] Register + login works
- [ ] Products visible on storefront (after adding via admin)
- [ ] Checkout creates order in DB
- [ ] Admin can see orders and change status
- [ ] Image uploads save to persistent storage
- [ ] Analytics events being tracked (check AnalyticsEvent table)
- [ ] `.env` NOT committed to git

---

## Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
