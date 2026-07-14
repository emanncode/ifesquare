/** Local dashboard models (seed UI until the ledger API is fully wired). */

export type Product = {
  id: string
  name: string
  unit: string
  /** Running opening stock for today */
  stock: number
  price: number
}

export type DayEntry = {
  receipts: string
  closing: string
}

export type LedgerRow = Product & {
  receiptsRaw: string
  closingRaw: string
  total: number
  sales: number | null
  amount: number | null
}

export type NewProductForm = {
  name: string
  unit: string
  stock: string
  price: string
}

export type BarDatum = { name: string; Amount: number }
export type PieDatum = { name: string; value: number }
export type LineDatum = { date: string; Revenue: number }
