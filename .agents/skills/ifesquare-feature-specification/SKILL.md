---
name: ifesquare-feature-specification
description: Current Ifesquare capabilities, API groups, data model, and business invariants.
---

# Ifesquare Feature Specification

## Active product surfaces

- `/` is a public product page with self-serve account creation as its primary CTA.
- `/register` creates an owner account and collects store profile details.
- `/app` provides the current ledger; `/app/products`, `/app/history`, and `/app/settings` are owner-only.

## API groups

- Authentication: registration, login, logout, current profile, profile updates, and password changes.
- Products: listing, bulk/single creation, update, archive/restore, delete, import, and CSV template.
- Ledger: current ledger, current/past entry updates, close day, guarded sync, and manual summary sending.
- History and analytics: closed-day list/detail/export and monthly comparison.
- Administration: owner-scoped staff accounts and audit log.

## Business rules

- Business dates are calculated in `Africa/Lagos`; the day rolls over at 2:00 AM.
- Close day is atomic and fills null closings as zero-sales stock, updates master stock, locks history, and dispatches configured notifications.
- Staff can update only receipts and closing counts for today. Their payloads must contain no usable price or revenue data.
- Product and ledger writes invalidate relevant cached reads.
- Supported offline writes queue in IndexedDB; day close, CSV, and notifications stay online-only.

## Persistence

The SQLite/Turso schema uses 11 embedded migrations. `users`, products, days, entries, audit records, session-revocation metadata, and notification recipient fields are all owner-scoped where applicable.
