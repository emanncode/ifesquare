/** Shared domain types aligned with the Go API JSON (snake_case fields). */

export type User = {
  id: number
  email: string
  phone_number: string | null
  notify_on_close: boolean
}

/** GET/POST /api/products */
export type ApiProduct = {
  id: number
  name: string
  price: number
  stock: number
  low_stock_threshold: number | null
  archived_at?: string | null
  created_at: string
}

/** One row from GET /api/ledger/today */
export type ApiLedgerEntry = {
  id: number
  day_date: string
  product_id: number
  product_name: string
  opening: number
  receipts: number
  closing: number | null
  price: number
  effective_threshold: number
  current_stock: number
  is_low_stock: boolean
  created_at?: string
  updated_at?: string
}

/** GET /api/history */
export type ApiHistoryDaySummary = {
  date: string
  closed_at: string
  total_revenue: number
  total_units: number
}

/** GET /api/history/:date */
export type ApiHistoryDayDetail = {
  date: string
  entries: Array<
    ApiLedgerEntry & {
      total: number
      sales: number | null
      amount: number | null
    }
  >
  total_revenue: number
  total_units: number
}

/** Derived UI row for today's ledger table. */
export type LedgerRow = {
  id: number
  productId: number
  name: string
  stock: number
  price: number
  receipts: number
  closing: number | null
  total: number
  sales: number | null
  amount: number | null
  effectiveThreshold: number
  currentStock: number
  isLowStock: boolean
}

/** GET /api/analytics/monthly-comparison */
export type MonthlyComparison = {
  current: { from: string; to: string; revenue: number; units: number }
  previous: { from: string; to: string; revenue: number; units: number }
  revenueDeltaPct: number | null
  unitsDeltaPct: number | null
}

export function deriveLedgerRow(e: ApiLedgerEntry): LedgerRow {
  const total = e.opening + e.receipts
  const hasClosing = e.closing != null && e.closing > 0
  const sales = hasClosing ? Math.max(0, total - (e.closing as number)) : null
  const amount = sales != null ? sales * e.price : null
  return {
    id: e.id,
    productId: e.product_id,
    name: e.product_name,
    stock: e.opening,
    price: e.price,
    receipts: e.receipts,
    closing: e.closing != null && e.closing > 0 ? e.closing : null,
    total,
    sales,
    amount,
    effectiveThreshold: e.effective_threshold,
    currentStock: e.current_stock,
    isLowStock: e.is_low_stock,
  }
}
