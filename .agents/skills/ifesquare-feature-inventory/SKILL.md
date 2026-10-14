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
| **Close Day Finalization** | Auto-fill null closing counts, update product master stock, lock history | ✅ Complete | ✅ Complete | Irreversible once finalized; sends dual SMS & email summaries. |
| **Business Day Rollover** | 2:00 AM cut-off | ✅ Complete | ✅ Complete | Anchored to Africa/Lagos (WAT fallback). |
| **Offline Synchronization** | PWA Service Worker, IndexedDB queue, Web Locks replay | N/A | ✅ Complete | Automatically queues updates and syncs on reconnect. |
| **Product Catalog** | Product CRUD, low-stock threshold, CSV import/export | ✅ Complete | ✅ Complete | CSV duplicate checks enabled. |
| **History & Archive** | Closed days list, day details, owner adjustment, CSV export | ✅ Complete | ✅ Complete | Retains historical ledger records. |
| **Analytics & Insights** | MoM revenue comparison, Recharts visualizations, sparklines | ✅ Complete | ✅ Complete | Hidden from staff users. |
| **Notifications** | Owner day-close summary alerts | ✅ Complete | ✅ Configurable | Dual dispatch: Termii SMS (talert) + SMTP Email. Configurable in Settings. |
| **Audit Logging** | Entity mutation tracking with before/after state | ✅ Complete | ✅ Complete | Exposed in Settings Activity tab. |
| **Self-Serve Onboarding** | Owner registration, store setup wizard | ✅ Complete | ✅ Complete | Public /register, landing CTAs & first-run setup banner. |
| **Automated Day Closure** | Background worker to auto-finalize forgotten days | ✅ Complete | N/A | Background worker triggers at 2:02 AM WAT; auto_closed flag. |

---

## Technical Backlog & Completed Priorities

### Completed Milestones ✅
1. **Termii SMS Integration**: Connected Termii REST client defaulting to pre-approved `talert` sender ID. Verified live wallet balance.
2. **Timezone-Anchored Rollover**: Updated `db.GetToday()` to explicitly evaluate `Africa/Lagos` business timezone.
3. **Self-Serve Store Onboarding**: Built `/register` with store creation, landing page CTAs, and first-run inventory onboarding banner.
4. **Automated Close-Day Worker**: Added scheduled background ticker closing unfinalized ledgers at the 2:02 AM WAT rollover boundary.
5. **Core Test Suite**: Added automated integration tests for `internal/ledger` verifying calculation rules and staff price redaction.
6. **Store Profile & SMS Settings**: Added Store Name, Phone Number, and SMS Notification toggle to `SettingsPage.tsx` and `UpdateMe`.

### Future Enhancements & Backlog 📋
* **Multi-Store Management**: Support single owner managing multiple separate branch retail outlets under one login.
* **Barcode / QR Scanner**: Web camera barcode scanning for instant product selection during stock taking.
* **Direct WhatsApp Integration**: Connect Meta WhatsApp Business API for instant day-close dispatch.


