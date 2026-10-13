---
name: ifesquare-log-2026-08-16
description: Linear daily engineering log for 2026-08-16 on Ifesquare
---

# 2026-08-16

## Task Summary: Closing Stock Validation & Error Reversion

We added client-side validation, error handling, and visual/state rollback when editing product ledger fields (opening, receipts, closing, price).

### Key Features Implemented

1. **Validation Checks**:
   * Both the **Products Page** (today's active ledger) and the **History Days** products view now prevent entering a `closing` stock that exceeds the `total` stock (opening + receipts).
   * If a user tries to input an invalid closing stock, a toast notification immediately warns them: *"closing cannot exceed total (opening + receipts)"*.
2. **UI & Calculations Rollback**:
   * If the client-side check or server-side API patch fails, the application automatically catches the error and rolls back the optimistic UI state.
   * The cell text fields revert visually to their last valid values on focus out (blur), and the calculated total units and revenue are recalculated and restored.

### File Modifications

* **HistoryEditableTd.tsx**: Updated to await `onChange` and revert the local display state to the expected value if the change resolves to `false` (rejection).
* **DayDetailPanel.tsx**: Propagated the promise returned by `patchEntry` to the cell editors.
* **HistoryPage.tsx**: Added client-side check, try/catch around the API call, and full rollback of the `detail` state and left panel `days` list totals on error.
* **CatalogNumericTd.tsx**: Added `onBlur` handler to restore display to the correct prop-derived value on blur.
* **ProductsProvider.tsx**: Added client-side validation check in `patchCatalogField` to immediately abort before optimistic state updates, and added `refresh()` rollback on API failure.

### Commits Created

* **Commit 1 (a98e0f6)**: `fe(products): add client-side closing stock validation and rollback on error`
* **Commit 2 (d8159bd)**: `fe(history): add client-side closing stock validation and rollback on error`