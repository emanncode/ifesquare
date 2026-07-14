# Ledger Testing with Postman

## Prerequisites

1. Start the server:
   ```bash
   cd backend
   JWT_SECRET=changeme go run ./cmd/server
   ```

2. Seed an admin user (one time):
   ```bash
   JWT_SECRET=changeme ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=test123 go run ./cmd/server -seed
   ```

3. Open Postman.

---

## Step 1 — Login to get the cookie

**Request**

```
POST http://localhost:8080/api/auth/login
```

**Body** (raw JSON):
```json
{
  "email": "admin@test.com",
  "password": "test123"
}
```

**After sending:** Postman will automatically store the `token` httpOnly cookie (go to **Cookies** in the response headers section to confirm).

---

## Step 2 — Create some products

**Request**

```
POST http://localhost:8080/api/products
```

**Body** (raw JSON):
```json
{
  "name": "Coca-Cola",
  "unit": "bottle",
  "price": 3000,
  "stock": 50
}
```

Create 2–3 more products to have data to work with:
```json
{ "name": "Water",     "unit": "bottle", "price": 1500, "stock": 100 }
{ "name": "Chips",     "unit": "pack",   "price": 5000, "stock": 30  }
```

---

## Step 3 — View today's ledger (auto-creates entries)

**Request**

```
GET http://localhost:8080/api/ledger/today
```

**Expected response** — an array of entries, one per product, each with:

```json
{
  "id": 1,
  "day_date": "2026-07-12",
  "product_id": 1,
  "opening": 50,
  "receipts": 0,
  "closing": null,
  "price": 3000,
  "product_name": "Coca-Cola",
  "product_unit": "bottle"
}
```

Note that `opening` matches the product's current `stock` at the time the entry was created, and `closing` is `null`.

---

## Step 4 — Add receipts and manual closing counts

Simulate a day of business:

**Request**

```
PATCH http://localhost:8080/api/ledger/today/1
```

**Body**:
```json
{
  "receipts": 10,
  "closing": 55
}
```

This means:
- You had 50 bottles at opening
- Received 10 more (receipts)
- Counted 55 at closing (5 were sold / used)

Repeat for other products:
```
PATCH http://localhost:8080/api/ledger/today/2   → { "receipts": 5,  "closing": 90  }
PATCH http://localhost:8080/api/ledger/today/3   → { "receipts": 20, "closing": 40  }
```

You can also update just `receipts` or just `closing` individually.

**Verify** by calling `GET /api/ledger/today` again.

---

## Step 5 — Close the day

**Request**

```
POST http://localhost:8080/api/ledger/close
```

**Expected:**
```json
{ "message": "day closed" }
```

What happens internally (in a single transaction):

1. Any entry where `closing IS NULL` gets `closing = opening + receipts`
2. Each product's `stock` is updated to match its `closing` count
3. The day gets a `closed_at` timestamp

---

## Step 6 — Verify the close

### Check that product stock was updated

**Request**

```
GET http://localhost:8080/api/products
```

Coca-Cola stock should now be `55`, Water `90`, Chips `40`.

### Check history

```
GET http://localhost:8080/api/history
```

Returns all closed entries across all days. Filter by date:

```
GET http://localhost:8080/api/history/2026-07-12
```

---

## Step 7 — Next day flow

The next time you call `GET /api/ledger/today`, it creates fresh entries for the new date with `opening` set to each product's current `stock`.

1. Check products to see current stock
2. `GET /api/ledger/today` — entries created with correct openings
3. Update receipts/closing during the day
4. `POST /api/ledger/close` at end of day

---

## Full flow at a glance

| Step | Action |
|---|---|
| 1 | `POST /api/auth/login` — authenticate |
| 2 | `POST /api/products` — create products |
| 3 | `GET /api/ledger/today` — opens the day, creates entry rows |
| 4 | `PATCH /api/ledger/today/:productId` — record receipts/closing |
| 5 | `POST /api/ledger/close` — finalize day, update stock |
| 6 | `GET /api/products` — confirm stock updated |
| 7 | Next day → repeat from step 3 |
