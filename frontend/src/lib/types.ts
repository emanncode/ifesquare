/** Shared domain types for the Ifesquare shop ledger. */

export type User = {
  id: number
  email: string
}

export type Product = {
  id: number
  name: string
  unit: string
  price: number
  stock: number
  createdAt: string
  archivedAt?: string | null
}

/** One product line on a ledger day. sales & amount are derived, never stored. */
export type LedgerEntry = {
  id: number
  dayDate: string
  productId: number
  productName: string
  unit: string
  opening: number
  receipts: number
  closing: number | null
  price: number
  /** Derived: opening + receipts */
  total: number
  /** Derived: total - closing (null if closing not set) */
  sales: number | null
  /** Derived: sales * price (null if sales not set) */
  amount: number | null
}

export type TodayLedger = {
  date: string
  closed: boolean
  entries: LedgerEntry[]
}

export type HistoryDaySummary = {
  date: string
  totalRevenue: number
  totalUnits: number
  closedAt: string
}

export type HistoryDayDetail = {
  date: string
  closedAt: string
  entries: LedgerEntry[]
  totalRevenue: number
  totalUnits: number
}
