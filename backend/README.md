# Ifesquare Backend

Go server for the Ifesquare inventory / daily-ledger application.

---

## Folder Structure

```
backend/
├── cmd/server/main.go          # entrypoint — routes, static serve, seed flag
├── internal/
│   ├── auth/
│   │   ├── auth.go             # JWT issue/verify, bcrypt helpers
│   │   ├── handlers.go         # POST login/logout, GET me
│   │   └── middleware.go        # httpOnly-cookie JWT guard
│   ├── db/
│   │   ├── db.go               # DB init, pragma, embedded migration runner
│   │   └── migrations/
│   │       └── 001_init.sql    # schema: users, products, days, entries
│   ├── history/
│   │   ├── handlers.go         # GET /api/history, GET /api/history/:date
│   │   └── store.go            # query helpers for history
│   ├── ledger/
│   │   ├── handlers.go         # GET today, PATCH entry, POST close
│   │   └── store.go            # entry CRUD, day-close transaction
│   └── products/
│       ├── handlers.go         # CRUD handlers + soft-delete
│       └── store.go            # product query/update helpers
├── go.mod
└── go.sum
```

---

## Database<p className="text-muted-foreground text-sm">Login page — coming soon</p>

SQLite via `modernc.org/sqlite`. Single connection (`SetMaxOpenConns(1)`) — SQLite is happiest single-writer for a shop app.

**Tables**

| Table | Purpose |
|---|---|
| `users` | Admin login (`id`, `email`, `password_hash`) |
| `products` | Inventory items (`name`, `unit`, `price`, `stock`, `archived_at`) |
| `days` | Calendar days the ledger was opened (`date`, `closed_at`) |
| `entries` | Per-product daily counts (`opening`, `receipts`, `closing`, `price`) |

- `PRAGMA foreign_keys = ON` on every connection.
- Migration runs automatically on boot — embed-safe `CREATE TABLE IF NOT EXISTS`.

---

## Auth

- **Login** — `POST /api/auth/login` reads `{ email, password }`, bcrypt-verifies, issues a 72-hour JWT, sets an `httpOnly` cookie named `token`.
- **Logout** — `POST /api/auth/logout` clears the cookie.
- **Me** — `GET /api/auth/me` returns the current user (requires cookie).
- **Seed** — No public sign-up. Run once with `-seed` flag:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=secret \
JWT_SECRET=changeme \
go run ./cmd/server -seed
```

---

## API Endpoints

All endpoints except `/api/health`, `/api/auth/login`, and `/api/auth/logout` require the `token` httpOnly cookie.

### Auth

```
POST   /api/auth/login      { email, password } → sets cookie, { id, email }
POST   /api/auth/logout     → clears cookie, { message }
GET    /api/auth/me         → { id, email } or 401
```

### Products

```
GET    /api/products          → [ { id, name, unit, price, stock, archived_at, created_at } ]
POST   /api/products          → { name, unit, price, stock } → 201
PATCH  /api/products/:id      → { name?, unit?, price?, stock? }
DELETE /api/products/:id      → sets archived_at (soft delete)
```

### Ledger

```
GET    /api/ledger/today               → auto-creates entry rows for unarchived products
PATCH  /api/ledger/today/:productId     → { receipts?, closing? }
POST   /api/ledger/close               → fills null closings, updates stock, marks day closed
```

`GET /api/ledger/today` creates a row for every unarchived product if one doesn't exist, with `opening` set to the product's current `stock`.

`POST /api/ledger/close` runs in a transaction:
1. Sets `closing = opening + receipts` for any entry where `closing IS NULL`
2. Updates `products.stock` to each entry's `closing` value
3. Sets `days.closed_at`

### History

```
GET    /api/history          ?limit=30   → recent entries across all days
GET    /api/history/:date                → entries for a specific day
```

### Health

```
GET    /api/health           → { "status": "ok" }
```

---

## Static File Serving

If `STATIC_DIR` (default `../frontend/dist`) exists, the server serves it as static files. Any request that doesn't match an existing file falls through to `index.html` — this lets `react-router-dom` handle client-side routes on page refresh.

To disable static serving, don't set `STATIC_DIR` or point it at a non-existent directory.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — (required) | HMAC key for signing JWTs |
| `DB_PATH` | `./ifesquare.db` | SQLite database file path |
| `STATIC_DIR` | `../frontend/dist` | Path to production frontend build |
| `PORT` | `8080` | HTTP listen port |
| `ADMIN_EMAIL` | — | Used with `-seed` flag |
| `ADMIN_PASSWORD` | — | Used with `-seed` flag |

`.env` files are loaded if present (via `godotenv`).

---

## CORS

Allowed origins: `http://localhost:5173` (Vite dev server) and `http://localhost:3000`. Credentials (cookies) enabled. Tweak `main.go` for production domains.

---

## Middleware Stack (top to bottom)

1. **Logger** — chi's built-in request logger
2. **Recoverer** — chi's panic recovery
3. **CORS** — permissive for dev
4. **Auth** (on protected routes) — reads `token` cookie, validates JWT, attaches `user_id` to request context
