# Ifesquare Product Specification

## Product

Ifesquare is a self-serve inventory and daily-ledger product for independent retailers. It keeps the paper-ledger workflow familiar while joining stock counts, calculated sales, history, and owner controls in one application.

## Roles

| Role | Access |
| --- | --- |
| Owner | Full ledger, catalog, prices, revenue, analytics, history, settings, staff, notifications, and audit log. |
| Staff | Current-day ledger only; may record receipts and closing counts. Prices, revenue, analytics, history, settings, and owner actions are blocked and redacted by the API. |

## Ledger rules

- A ledger entry contains opening, receipts, closing, price, and computed fields.
- `sales = opening + receipts - closing`; `amount = sales × price`.
- A business day rolls over at 2:00 AM in `Africa/Lagos`.
- Closing a day fills missing closings with `opening + receipts`, updates master stock, locks the day, records audit activity, invalidates caches, and dispatches configured notifications.
- The auto-close worker closes unfinished prior days after rollover.
- The next day initializes from the most recently closed day's closing stock.

## Customer flow

1. A new owner creates an account at `/register` with store name, email, password, and optional phone number.
2. The owner adds products manually or through CSV import.
3. The shop records receipts and closing counts in the current ledger.
4. The owner reviews results, closes the day, and can later inspect or export history.

## Application areas

- Public page: product introduction and account creation CTA.
- Ledger dashboard: current-day counts, summaries, charts, and close-day action for owners; a restricted table for staff.
- Products: owner catalog with inline editing, search, low-stock filtering, bulk actions, import, archive, and restore.
- History: owner-only closed-day review, permitted corrections, and CSV export.
- Settings: store profile, optional close-day SMS, additional email recipients, staff accounts, and audit trail.

## Reliability and security

- JWT authentication is stored in an HTTP-only cookie; login has per-email rate limiting.
- Owner scope and role checks protect every sensitive route.
- Offline mutations use IndexedDB and are replayed once, with cross-tab coordination.
- Read responses are cached in memory and invalidated on writes.
- SQLite is used locally; Turso/libSQL is supported in production. The schema is maintained by 11 embedded migrations.

## Public positioning

The public product page speaks to independent retailers without making regional availability claims. The current application retains its existing currency and phone/SMS behavior.
