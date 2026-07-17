import { createContext } from "react"
import type { CatalogRow, NewProductForm } from "./types"

export const emptyForm: NewProductForm = {
  name: "",
  unit: "",
  stock: "",
  price: "",
  lowStockThreshold: "",
}

export type ProductsContextValue = {
  rows: CatalogRow[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addProduct: (form: NewProductForm) => Promise<void>
  addProducts: (forms: NewProductForm[]) => Promise<void>
  patchCatalogField: (
    productId: number,
    field: "name" | "unit" | "opening" | "receipts" | "closing" | "price" | "low_stock_threshold",
    value: string,
  ) => void
  removeProduct: (productId: number) => Promise<void>
}

export const ProductsContext = createContext<ProductsContextValue | null>(null)
