# Hardware Shop IMS — Frontend

React + Vite + TypeScript + Tailwind v4 + Radix/shadcn-style primitives,
talking to the `hardware-backend` API.

## Design direction

Internal ERP tool, not a marketing site — so the design leans utilitarian
rather than decorative:

- **Palette**: warm paper canvas, near-graphite dark mode, a hazard-orange
  accent (`#C6621B`) and a deep ledger-green secondary — deliberately
  distinct from generic AI-dashboard defaults (no cream+serif, no
  near-black+neon).
- **Type**: Public Sans for UI text, IBM Plex Mono for every number (SKUs,
  invoice numbers, currency, quantities) — the "ledger" signature that gives
  data its own visual register instead of blending into UI chrome.
- **Full dark mode** via a `dark` class on `<html>`, toggled from the topbar.

## Structure

```
src/
├── api/          thin axios wrappers per resource (auth, products, transactions, ...)
├── components/
│   ├── ui/       Button, Input, Card, Badge, Table, Select, Dialog (Radix-based)
│   ├── layout/   Sidebar, Topbar, AppLayout
│   └── PartyListPage.tsx   shared list+create UI for Customers/Suppliers
├── context/      AuthContext (session), ThemeContext (dark mode)
├── pages/        one per route
├── routes/       ProtectedRoute
├── lib/          api.ts (axios instance + refresh-token interceptor), utils.ts (cn)
└── types/        shared TS interfaces mirroring the Prisma models
```

## Auth model

The access token lives only in memory (`lib/api.ts`) — never localStorage,
so an XSS payload can't read it. The refresh token is an httpOnly cookie the
backend sets on login; JS never touches it directly. On page load,
`AuthContext` silently calls `/auth/refresh-token` to get a fresh access
token from that cookie. A 401 on any other request triggers one automatic
refresh-and-retry (see the response interceptor in `lib/api.ts`); if that
also fails, the user is bounced to `/login`.

## Pages implemented

Login, Dashboard (KPI cards + monthly trend chart + top products), Products
(search + create with opening stock), Purchases (multi-item entry against a
supplier), Sales/POS (multi-item checkout against a customer, live due-
amount calculation), Customers & Suppliers (shared list/create component),
Payments & Credit (due reports), Reports (profit/dead-stock/fast-moving +
PDF/Excel download for the sales report), Analytics (staff performance),
Settings (profile + password change).

Every list page follows the same shape (search → table → create dialog), so
adding Categories/Brands/Units/Deliveries/Expenses pages is a matter of
copying `ProductsPage.tsx` or reusing `PartyListPage.tsx` — not shown here to
avoid bloating the scaffold, but happy to add them next.

## Setup

```bash
cp .env.example .env     # points at the backend's /api/v1
npm install
npm run dev
```

Log in with the seeded admin (`admin@hardwareims.local` / your
`SEED_ADMIN_PASSWORD`) once the backend is running and seeded.

## Note on package.json

Two packages were added to `devDependencies` that weren't in the original
list but are required for the TS/ESLint setup you specified: `typescript`
and `typescript-eslint`. Everything else matches what you gave me exactly.

## Verification note

Same caveat as the backend: no network access here, so I couldn't run
`npm install` or `vite build` to confirm this compiles. Every `.tsx`/`.ts`
file was written against the exact package versions listed and cross-checked
by hand for import correctness, but please run `npm run build` locally
before deploying.
