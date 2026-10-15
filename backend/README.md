# Ifesquare API

The Go service powers Ifesquare's self-serve retailer ledger. It serves JSON under `/api`, authenticates with JWT cookies, and can serve the built frontend when `STATIC_DIR` points to `frontend/dist`.

## Local start

```bash
JWT_SECRET=local-development-secret go run ./cmd/server
```

Defaults: port `8080` and local SQLite database `./ifesquare.db`. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to use libSQL in production.

## Core behavior

- `POST /api/auth/register` creates an owner account and signs it in.
- Owners manage products, staff, settings, historical records, analytics, and day closing.
- Staff can update receipts and closing counts for the current ledger only. Price and revenue data are withheld from their API responses.
- The business date uses `Africa/Lagos` with a 2:00 AM rollover.
- Closing a day is an atomic transaction: empty closings become `opening + receipts`, master stock is updated, the day is locked, caches are invalidated, and configured notifications are dispatched.
- The auto-close worker checks after the rollover and closes unfinished prior days.

## API groups

| Group | Main endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | `POST /api/auth/register`, `/login`, `/logout`; `GET/PATCH /api/auth/me` |
| Products | `GET/POST /api/products`, `PATCH/DELETE /api/products/{id}`, CSV import/template, archive and restore operations |
| Ledger | `GET /api/ledger/today`, `PATCH /api/ledger/today/{productId}`, `POST /api/ledger/close`, summary delivery |
| History and analytics | History listing, day detail/export, and monthly comparison |
| Owner administration | Staff accounts and audit log |

## Data and operations

SQLite development and Turso production use the same 11 embedded migrations in `internal/db/migrations/`. Mutations invalidate related in-memory cache entries. Optional services include Termii SMS, SMTP email, and Sentry; each activates only when its environment variables are present.

## Verification

```bash
go test ./...
go build -o bin/server ./cmd/server
```
