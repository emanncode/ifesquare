import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { api, ApiError, mutateWithOffline } from "@/lib/api"
import type { ApiLedgerEntry, ApiProduct } from "@/lib/types"
import { parseCommaInt } from "./format"
import { useToast } from "@/hooks/useToast"
import { ProductsContext } from "./productsContext"
import type { CatalogRow, NewProductForm } from "./types"
import { useAuth } from "@/hooks/useAuth"

function formatError(err: unknown): string {
  if (err instanceof ApiError && err.status >= 500) {
    return "A server error occurred. Please check the server logs and try again."
  }
  return err instanceof Error ? err.message : "Failed to load products"
}

function merge(products: ApiProduct[], entries: ApiLedgerEntry[]): CatalogRow[] {
  const byProduct = new Map<number, ApiLedgerEntry>()
  for (const e of entries) {
    byProduct.set(e.product_id, e)
  }

  return products.map((p) => {
    const e = byProduct.get(p.id)
    const opening = e?.opening ?? p.stock
    const receipts = e?.receipts ?? 0
    const closing = e?.closing ?? null
    const price = e?.price ?? p.price
    const total = opening + receipts
    const sales = closing != null && closing > 0 ? Math.max(0, total - closing) : 0
    const amount = sales * price
    return {
      productId: p.id,
      name: p.name,
      opening,
      receipts,
      closing,
      price,
      total,
      sales,
      amount,
      lowStockThreshold: p.low_stock_threshold,
      effectiveThreshold: e?.effective_threshold ?? 10,
      currentStock: e?.current_stock ?? 0,
      isLowStock: e?.is_low_stock ?? false,
    }
  })
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [rows, setRows] = useState<CatalogRow[]>([])
  const [loading, setLoading] = useState(isAuthenticated)
  const [error, setError] = useState<string | null>(null)
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const [products, entries] = await Promise.all([
        api<ApiProduct[]>("/api/products"),
        api<ApiLedgerEntry[]>("/api/ledger/today"),
      ])
      setRows(merge(products ?? [], entries ?? []))
    } catch (err) {
      setError(formatError(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    void (async () => {
      try {
        const [products, entries] = await Promise.all([
          api<ApiProduct[]>("/api/products"),
          api<ApiLedgerEntry[]>("/api/ledger/today"),
        ])
        if (!cancelled) {
          setRows(merge(products ?? [], entries ?? []))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatError(err))
          setRows([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const addProduct = useCallback(
    async (form: NewProductForm) => {
      if (!form.name.trim()) return
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        stock: parseCommaInt(form.stock),
        price: parseCommaInt(form.price),
      }
      if (form.lowStockThreshold) {
        body.low_stock_threshold = parseCommaInt(form.lowStockThreshold)
      }
      const r = await mutateWithOffline<ApiProduct>("/api/products", "POST", body)
      if (r !== null) await refresh()
    },
    [refresh],
  )

  const addProducts = useCallback(
    async (forms: NewProductForm[]) => {
      const valid = forms.filter((f) => f.name.trim())
      if (valid.length === 0) return
      const r = await mutateWithOffline("/api/products", "POST", {
        products: valid.map((f) => {
          const p: Record<string, unknown> = {
            name: f.name.trim(),
            stock: parseCommaInt(f.stock),
            price: parseCommaInt(f.price),
          }
          if (f.lowStockThreshold) {
            p.low_stock_threshold = parseCommaInt(f.lowStockThreshold)
          }
          return p
        }),
      })
      if (r !== null) await refresh()
    },
    [refresh],
  )

  const patchCatalogField = useCallback(
    (
      productId: number,
      field: "name" | "opening" | "receipts" | "closing" | "price" | "low_stock_threshold",
      value: string,
    ) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.productId !== productId) return r
          const next = { ...r }
          if (field === "name") next.name = value
          else if (field === "opening") next.opening = parseCommaInt(value)
          else if (field === "receipts") next.receipts = parseCommaInt(value)
          else if (field === "closing") next.closing = parseCommaInt(value) || null
          else if (field === "price") next.price = parseCommaInt(value)
          else if (field === "low_stock_threshold") {
            const n = parseCommaInt(value)
            next.lowStockThreshold = value === "" ? null : n
            next.effectiveThreshold = value === "" ? 10 : n
            next.isLowStock = next.currentStock <= next.effectiveThreshold
          }
          next.total = next.opening + next.receipts
          next.sales = next.closing != null && next.closing > 0 ? Math.max(0, next.total - next.closing) : 0
          next.amount = next.sales * next.price
          return next
        }),
      )

      const key = `${productId}:${field}`
      const existing = debounceTimers.current.get(key)
      if (existing) clearTimeout(existing)

      debounceTimers.current.set(
        key,
        setTimeout(async () => {
          debounceTimers.current.delete(key)
          let ok = false
          try {
            if (field === "low_stock_threshold") {
              const body: Record<string, number | null> = {}
              body.low_stock_threshold = value === "" ? null : parseCommaInt(value)
              const r = await mutateWithOffline(`/api/products/${productId}`, "PATCH", body)
              ok = r !== null
            } else if (field === "opening" || field === "price") {
              const val = parseCommaInt(value)
              const [r1, r2] = await Promise.all([
                mutateWithOffline(`/api/ledger/today/${productId}`, "PATCH", { [field]: val }),
                mutateWithOffline(`/api/products/${productId}`, "PATCH", field === "opening" ? { stock: val } : { price: val }),
              ])
              ok = r1 !== null && r2 !== null
            } else if (field === "receipts" || field === "closing") {
              const body: Record<string, number> = {}
              body[field] = parseCommaInt(value)
              const r = await mutateWithOffline(`/api/ledger/today/${productId}`, "PATCH", body)
              ok = r !== null
            } else if (field === "name") {
              const r = await mutateWithOffline(`/api/products/${productId}`, "PATCH", { name: value })
              ok = r !== null
            }
            if (ok) {
              const [products, entries] = await Promise.all([
                api<ApiProduct[]>("/api/products"),
                api<ApiLedgerEntry[]>("/api/ledger/today"),
              ])
              setRows(merge(products ?? [], entries ?? []))
            }
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              window.location.href = "/login"
              return
            }
            toast(formatError(err))
          }
        }, 500),
      )
    },
    [],
  )

  const removeProduct = useCallback(
    async (productId: number) => {
      await api(`/api/products/${productId}`, { method: "DELETE" })
      setRows((prev) => prev.filter((r) => r.productId !== productId))
    },
    [],
  )

  const value = useMemo(
    () => ({
      rows,
      loading,
      error,
      refresh,
      addProduct,
      addProducts,
      patchCatalogField,
      removeProduct,
    }),
    [rows, loading, error, refresh, addProduct, addProducts, patchCatalogField, removeProduct],
  )

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  )
}
