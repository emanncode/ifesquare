import { useContext } from "react"
import { ProductsContext } from "./productsContext"

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) {
    throw new Error("useProducts must be used within ProductsProvider")
  }
  return ctx
}
