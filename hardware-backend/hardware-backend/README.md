# Hardware Shop IMS — Backend

Restructured into the layered (controllers/routes/services/middleware) shape
you specified, with the business logic from the first pass carried over and
expanded to cover every module in the folder list.

## Folder structure

```
backend/
├── src/
│   ├── config/          database.js, redis.js, email.js, multer.js, cloudinary.js, env.js
│   ├── controllers/      one per resource (authController.js, productController.js, ...)
│   ├── routes/           one per resource, mounted in routes/index.js
│   ├── middleware/       auth.js, roleCheck.js, validate.js, errorHandler.js, upload.js, rateLimiter.js, logger.js, activityLogger.js
│   ├── services/         business logic — the only layer allowed to orchestrate multi-step transactions
│   ├── repositories/     raw Prisma queries for entities with non-trivial query logic (currently: products)
│   ├── validations/      Zod schemas, one per resource
│   ├── constants/        roles.js, statuses.js, paymentMethods.js, notificationTypes.js
│   ├── seeds/            adminSeeder.js, categorySeeder.js, productSeeder.js, index.js
│   ├── jobs/
│   │   ├── cron/         lowStockAlert.js, creditReminder.js, reportGenerator.js (node-cron)
│   │   └── queue/        emailQueue.js, notificationQueue.js (BullMQ + Redis, best-effort)
│   ├── app.js
│   └── ...
├── uploads/{products,invoices,profiles,temp}/
├── logs/                 error.log, combined.log (written by Winston at runtime)
├── prisma/schema.prisma
├── Dockerfile
└── docker-compose.yml    api + postgres + redis
```

A couple of deliberate deviations from the literal list, both noted inline
in the code:
- **`repositories/` and `validations/`** were added (not in your list) to
  keep Prisma queries and Zod schemas out of controllers — standard clean-
  architecture separation. Only `products` currently has a full repository;
  everything else queries Prisma directly from its service, which is fine at
  this schema size.
- **`rawMaterialController.js` / `productionController.js`** are honest
  placeholders that return `501 Not Implemented` with an explanation, not
  fake data — the schema (and the original 14-step spec) covers retail
  resale only, not manufacturing/BOM. Tell me what that workflow should look
  like and I'll model it properly.

## What's real vs. scaffolded

**Fully implemented, transactional, tested-by-reading-twice:**
Auth (JWT + rotating refresh + RBAC), Products (+ image upload), Categories/
Brands/Units, Suppliers, Customers, Purchase Orders, Sales Orders, the Stock
engine (ledger-based, never a mutable counter), Stock Adjustments, Payments,
Credit (due reports), Expenses, Deliveries, Notifications, Analytics/
Dashboard, Staff Performance, Activity Logs, and Reports (sales/purchase/
profit/expense/stock-valuation/dead-stock/fast-moving, with PDF + Excel
export wired for the sales report as the reference pattern).

**Best-effort / degrades gracefully:** Redis-backed queues and cron jobs —
if Redis isn't running, the app logs a warning and continues; nothing about
core sale/purchase/stock flows depends on Redis being up.

**Honest placeholders:** Raw Materials, Production (see above).

## Setup

```bash
cp .env.example .env      # DATABASE_URL, JWT secrets, optionally REDIS_URL/SMTP/Cloudinary
npm install
npm run prisma:migrate    # creates all 22 tables
npm run prisma:seed       # roles/permissions/admin user/categories/units/sample products
npm run dev
```

Default login: `admin@hardwareims.local` / value of `SEED_ADMIN_PASSWORD`
(defaults to `ChangeMe@123`).

### Docker

```bash
docker compose up --build
```
Spins up Postgres + Redis + the API together. Run migrations/seed once
against it with `docker compose exec api npm run prisma:migrate` /
`npm run prisma:seed`.

## API surface

All routes are under `/api/v1`: `/auth`, `/users`, `/profile`, `/products`,
`/categories`, `/brands`, `/units`, `/suppliers`, `/customers`,
`/purchase-orders`, `/sales-orders`, `/deliveries`, `/stock`,
`/stock-adjustments`, `/credit`, `/payments`, `/expenses`, `/notifications`,
`/analytics`, `/reports`, `/staff-performance`, `/activity-logs`, plus the
`/raw-materials` and `/production` placeholders.

## Verification note

I don't have network/npm access in this environment, so I couldn't run
`npm install` or actually boot the server here. Every file was syntax-checked
(`node --check`) and every relative import path was programmatically
resolved against the filesystem — both passed clean — but please run it
locally before deploying, especially the Prisma migration.
