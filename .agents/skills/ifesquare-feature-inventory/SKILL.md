---
name: ifesquare-feature-inventory
description: Feature inventory, component matrix, and enhancement backlog for the Ifesquare platform.
---

# Feature & Component Inventory

## Current Feature Matrix

| Feature | Sub-components | Backend Status | Frontend Status | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Authentication & RBAC** | JWT HttpOnly Cookie, sliding-window rate limit, Owner & Staff roles | ✅ Complete | ✅ Complete | Staff role restrictions enforced in API & UI. |
| **Active Daily Ledger** | Opening, Receipts, Closing stock table, real-time math | ✅ Complete | ✅ Complete | Auto-initializes daily entries on access. |
| **Close Day Finalization** | Auto-fill null closing counts, update product master stock, lock history | ✅ Complete | ✅ Complete | Irreversible once finalized; sends summary. |
| **Business Day Rollover** | 2:00 AM cut-off | ⚠️ Basic (`Add(-2h)`) | ✅ Complete | Needs timezone anchoring (`Africa/Lagos`). |
| **Offline Synchronization** | PWA Service Worker, IndexedDB queue, Web Locks replay | N/A | ✅ Complete | Automatically queues updates and syncs on reconnect. |
| **Product Catalog** | Product CRUD, low-stock threshold, CSV import/export | ✅ Complete | ✅ Complete | CSV duplicate checks enabled. |
| **History & Archive** | Closed days list, day details, owner adjustment, CSV export | ✅ Complete | ✅ Complete | Retains historical ledger records. |
| **Analytics & Insights** | MoM revenue comparison, Recharts visualizations, sparklines | ✅ Complete | ✅ Complete | Hidden from staff users. |
| **Notifications** | Owner day-close summary alerts | ⚠️ Email only | ✅ Configurable | Termii SMS integration pending. |
| **Audit Logging** | Entity mutation tracking with before/after state | ✅ Complete | ✅ Complete | Exposed in Settings Activity tab. |
| **Self-Serve Onboarding** | Owner registration, store setup wizard | ❌ CLI-only | ❌ Missing | Requires public signup & initial setup flow. |
| **Automated Day Closure** | Background worker to auto-finalize forgotten days | ❌ Missing | N/A | Requires server-side cron or scheduled worker. |

---

## Technical Backlog & Priorities

1. **Termii SMS Integration**: Connect to Termii API to dispatch SMS alerts to owners on day closure.
2. **Timezone-Anchored Rollover**: Update `db.GetToday()` to explicitly evaluate the business timezone.
3. **Self-Serve Store Onboarding**: Implement `/register` with store creation and first-time product setup wizard.
4. **Automated Close-Day Cron**: Add scheduled background task to close unfinalized ledgers at the rollover boundary.
5. **Core Test Suite**: Add comprehensive integration tests for `internal/ledger` and `internal/history`.

