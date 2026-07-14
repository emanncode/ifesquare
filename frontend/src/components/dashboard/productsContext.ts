import { createContext } from "react"
import type { CatalogRow, NewProductForm } from "./types"

export const emptyForm: NewProductForm = {
  name: "",
  unit: "",
  stock: "",
  price: "",
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
    field: "name" | "unit" | "opening" | "receipts" | "closing" | "price",
    value: string,
  ) => Promise<void>
  removeProduct: (productId: number) => Promise<void>
  syncFromLastClosed: () => Promise<string | null>
}

export const ProductsContext = createContext<ProductsContextValue | null>(null)
