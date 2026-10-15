---
name: ifesquare-frontend
description: Frontend architecture, React 19, TypeScript, Vite 8, Tailwind v4, PWA, and offline-first IndexedDB sync queue for Ifesquare.
---

# Ifesquare Frontend Engineering Guide

## Architecture Overview

The frontend client is an offline-first Single Page Application (SPA) and Progressive Web App (PWA) built with **React 19**, **TypeScript**, and **Vite 8**.

```
frontend/
├── src/
│   ├── components/          # Reusable UI elements, metric cards, ledger tables
│   │   ├── ui/              # shadcn/ui primitives (button, dialog, input, table)
│   │   └── ...              # Dashboard, Navbar, MetricCard, MoMCard, ProductTable
│   ├── hooks/               # Custom state & API query hooks (useAuth, useLedger)
│   ├── lib/                 # Utilities, API client wrapper, formatters
│   │   ├── api.ts           # Fetch wrapper with cookie credentials and error handling
│   │   ├── offlineQueue.ts  # IndexedDB mutation queue using idb
│   │   └── utils.ts         # clsx/twMerge utility
│   ├── App.tsx              # Application layout & role-based routing
│   ├── main.tsx             # React DOM entry point
│   └── index.css            # Tailwind CSS v4 imports & variables
├── package.json
└── vite.config.ts           # Vite config with React plugin and PWA Workbox config
```

---

## Key Frontend Systems

### 1. Offline-First Mutation Queue (`idb`)
- **Queue Implementation**: `src/lib/offlineQueue.ts` utilizes the `idb` library to maintain an IndexedDB database for pending write actions.
- **Offline Behavior**:
  - When network requests fail (or `navigator.onLine === false`), mutation payloads (receipt updates, closing stock entries) are stored in the queue.
  - The UI updates optimistically with visual cues indicating uncommitted changes.
- **Reconnection Sync**:
  - The app listens to `window.addEventListener('online', ...)` and drains the queue sequentially upon reconnection.
  - Confirmed responses update the local state without requiring a full page refresh.

### 2. Role-Based Access Routing
- Handled in `App.tsx` and custom route guards:
  - **Public Routes**: `/` (product page), `/register`, `/login`. The product page must render without waiting for an authenticated-session request.
  - **Authenticated (Shared)**: `/app` (Today's Ledger Table). Staff sees filtered columns without prices or financial metrics.
  - **Owner-Only Routes**:
    - `/app/products`: Product catalog management and CSV imports.
    - `/app/history`: Historical closed ledgers and export tools.
    - `/app/settings`: Staff user management, store profile, and SMS configurations.
  - Any attempt by Staff to navigate to Owner routes redirects to `/app`.

### 3. Progressive Web App (PWA)
- Configured in `vite.config.ts` via `vite-plugin-pwa`.
- Implements Workbox runtime caching for static assets, scripts, and font files.
- Manifest enables "Add to Home Screen" on Android and iOS devices for full-screen shop-floor usage.

### 4. Data Visualization & Analytics
- Built with **Recharts**:
  - `MoMCard`: Month-over-month revenue comparison bar charts.
  - `RevenueChart`: Daily/weekly revenue progression.
  - `TopProducts`: High-volume inventory movers.

---

## Verification & Commands

```bash
# Type check with zero emit
cd frontend && npx tsc --noEmit

# ESLint validation
cd frontend && npm run lint

# Production build test
cd frontend && npm run build
```
