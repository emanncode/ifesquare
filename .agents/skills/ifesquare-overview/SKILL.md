---
name: ifesquare-overview
description: Current product, architecture, access model, and local setup for Ifesquare.
---

# Ifesquare Overview

Ifesquare is a self-serve inventory and daily-ledger product for independent retailers. The public page promotes account creation; it is not a coming-soon or waitlist flow.

## Product model

- A daily ledger tracks opening stock, receipts, closing stock, and computed sales and amounts.
- Sales are `opening + receipts - closing`; amount is sales multiplied by price.
- The business date uses `Africa/Lagos`, rolling over at 2:00 AM.
- Closing a day fills missing closing counts, updates product stock, locks the day, records an audit action, invalidates cache, and triggers configured SMS/email notifications.
- An auto-close worker finalizes unfinished prior days after rollover.

## Access model

- Owners have catalog, history, analytics, settings, staff, audit, and close-day access.
- Staff can use only the current ledger to update receipts and closing stock. Financial values must be withheld at the API boundary, not merely hidden in the frontend.

## Architecture

- `frontend/`: React 19, TypeScript, Vite 8, Tailwind v4, shadcn/ui, PWA caching, and an IndexedDB mutation queue.
- `backend/`: Go 1.26, Chi, JWT cookie auth, bcrypt, SQLite or Turso/libSQL, response cache, and optional Termii/SMTP/Sentry integrations.
- The schema has 11 embedded migrations.

## Local start

Run the backend with `JWT_SECRET=local-development-secret go run ./cmd/server`, then `npm run dev` in `frontend/`. Create an owner at `/register`.

## Non-negotiable invariants

Respect the 2:00 AM rollover, atomic day close, cache invalidation after mutations, offline queue semantics, and owner/staff RBAC on every change.
