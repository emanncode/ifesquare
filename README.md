# Ifesquare

Ifesquare is a self-serve inventory and daily-ledger web app for independent retailers. It replaces a paper stock book with a connected daily record: opening stock, receipts, closing stock, calculated sales, and preserved history.

## What it does

- Creates a daily ledger from each active product's opening stock.
- Calculates sales and amounts from `opening + receipts - closing`.
- Carries the previous closed day's closing stock into the next business day.
- Gives owners a full catalog, history, analytics, staff management, audit log, and close-day controls.
- Gives staff a restricted current-day ledger with financial data withheld by both the UI and API.
- Queues supported changes locally when offline and replays them when the connection returns.
- Sends optional day-close notifications by SMS and email.

The business day is anchored to `Africa/Lagos` and rolls over at 2:00 AM. A background worker closes an unfinished prior day after the rollover, filling missing closing counts with zero-sales values.

## Stack

- Frontend: React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui, Framer Motion, Recharts, and Workbox PWA support.
- Backend: Go 1.26, Chi, JWT cookie authentication, bcrypt, in-memory response caching, and Sentry when configured.
- Data: SQLite locally or Turso/libSQL in production, with 11 embedded migrations.

## Local development

Requirements: Go 1.26+ and Node.js 20+.

```bash
cd backend
JWT_SECRET=local-development-secret go run ./cmd/server
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and create an owner account at `/register`. The frontend proxies local `/api` requests to the Go server.

## Verification

```bash
cd backend && go test ./...
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

## Repository map

- `backend/`: Go API, migrations, notifications, and ledger rules.
- `frontend/`: React PWA and public acquisition page.
- `docs/`: active product specification and dated engineering records.
- `.agents/skills/`: maintained product and implementation context for coding agents.
