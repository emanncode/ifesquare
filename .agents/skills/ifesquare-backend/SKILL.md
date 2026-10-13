---
name: ifesquare-backend
description: Architecture, Go 1.26 Chi router patterns, database pool management, response caching, and API standards for the Ifesquare backend.
---

# Ifesquare Backend Engineering Guide

## Architecture Overview

The backend is built in **Go 1.26** with the **Chi v5 HTTP router**. It follows a clean, modular structure under `backend/internal/`:

```
backend/
├── cmd/server/main.go       # Entry point, CLI flags, graceful shutdown
├── internal/
│   ├── analytics/          # Month-over-month (MoM) revenue comparison handlers
│   ├── audit_log/          # User action logging & retrieval
│   ├── auth/               # JWT token issuance, cookie handling, password hashing
│   ├── cache/              # In-memory response cache & token revocation cache
│   ├── db/                 # DB initialization, connection pool, embedded SQL migrations
│   ├── history/            # Closed day retrieval, filtering, and CSV export
│   ├── ledger/             # Active business day CRUD, rollover, and CloseDay transaction
│   ├── notify/             # Termii SMS service integration
│   ├── products/           # Product catalog CRUD, search, stock levels, CSV import
│   └── users/              # Staff account provisioning, list, and deactivation
└── data/                   # Local SQLite dev database (dev.db)
```

---

## Key Backend Systems

### 1. Database & Migrations
- **Database Engine**: SQLite local (`backend/data/dev.db`) or Turso libSQL in production.
- **Connection Pooling**: Configured in `internal/db`:
  - `MaxOpenConns`: 10
  - `MaxIdleConns`: 10
  - `ConnMaxLifetime`: 1 hour
- **Embedded Migrations**: 8 SQL migrations embedded using `embed.FS` in `internal/db/migrations/`. Automatically run during server boot.

### 2. Authentication & Rate Limiting
- **Cookie-Based JWT**: Signed JWT tokens stored in an `httpOnly`, `Secure`, `SameSite=Lax` cookie.
- **Auth Middleware**: Verifies token validity and checks against the in-memory token revocation cache.
- **Rate Limiting**: Sliding-window rate limiter protecting login endpoints (5 attempts per email per 15 minutes).

### 3. Response Caching
- **Implementation**: In-memory response cache (`internal/cache/cache.go`).
- **Endpoints Cached**: Read-heavy endpoints (e.g., product catalog list, closed history days).
- **Write Invalidation**: Any write mutation (product update, day close, stock adjustment) immediately purges relevant cache tags.

### 4. Ledger & Day Close Transaction
- **Active Day Calculation**: Business day begins and rolls over at **2:00 AM local time**.
- **Close Day Transaction**:
  - Starts an explicit SQL transaction: `tx, err := db.BeginTx(ctx, nil)`.
  - Auto-populates unentered closing stock counts with `opening_stock + receipts`.
  - Calculates `units_sold` and `sales_amount` for all items.
  - Updates master product quantities in `products` table.
  - Updates ledger status to `closed` with timestamp.
  - Commits transaction.
  - Dispatches summary SMS notification via `notify.SendCloseDaySMS(...)`.

### 5. Role-Based Access Control (RBAC)
- All endpoints verify user role from the authenticated JWT context.
- Staff requests to `/api/products` (editing/prices), `/api/history`, `/api/analytics`, or `/api/users` must be rejected with `403 Forbidden`.
- The ledger endpoint (`GET /api/ledger/today`) strips price and revenue fields when queried by Staff accounts.

---

## Verification & Commands

```bash
# Run tests across all internal packages
cd backend && go test ./...

# Build server binary
cd backend && go build -o bin/server ./cmd/server

# Run server with local dev config
./bin/server --port=8080 --db=./data/dev.db
```
