/** UI-local form + chart types for the dashboard modules. */

export type Product = {
  id: number
  name: string
  unit: string
  stock: number
  price: number
}

export type CatalogRow = {
  productId: number
  name: string
  unit: string
  opening: number
  receipts: number
  closing: number | null
  price: number
  total: number
  sales: number | null
  amount: number | null
}

export type NewProductForm = {
  name: string
  unit?: string
  stock: string
  price: string
}

/** Re-export ledger row used by the view-only table. */
export type { LedgerRow } from "@/lib/types"

export type BarDatum = { name: string; Amount: number }
export type PieDatum = { name: string; value: number }
export type LineDatum = { date: string; Revenue: number }
