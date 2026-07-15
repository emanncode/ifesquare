import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api, ApiError } from "@/lib/api"
import type { ApiLedgerEntry, ApiProduct } from "@/lib/types"
import { parseCommaInt } from "./format"
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
    const opening = p.stock
    const receipts = e?.receipts ?? 0
    const closing = e?.closing ?? null
    const price = p.price
    const total = opening + receipts
    const sales = closing != null ? Math.max(0, total - closing) : null
    const amount = sales != null ? sales * price : null
    return {
      productId: p.id,
      name: p.name,
      unit: p.unit,
      opening,
      receipts,
      closing,
      price,
      total,
      sales,
      amount,
    }
  })
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [rows, setRows] = useState<CatalogRow[]>([])
  const [loading, setLoading] = useState(isAuthenticated)
  const [error, setError] = useState<string | null>(null)

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
      await api<ApiProduct>("/api/products", {
        method: "POST",
        body: {
          name: form.name.trim(),
          unit: form.unit.trim() || "unit",
          stock: parseCommaInt(form.stock),
          price: parseCommaInt(form.price),
        },
      })
      await refresh()
    },
    [refresh],
  )

  const addProducts = useCallback(
    async (forms: NewProductForm[]) => {
      const valid = forms.filter((f) => f.name.trim())
      if (valid.length === 0) return
      await api("/api/products", {
        method: "POST",
        body: {
          products: valid.map((f) => ({
            name: f.name.trim(),
            unit: f.unit.trim() || "unit",
            stock: parseCommaInt(f.stock),
            price: parseCommaInt(f.price),
          })),
        },
      })
      await refresh()
    },
    [refresh],
  )

  const patchCatalogField = useCallback(
    async (
      productId: number,
      field: "name" | "unit" | "opening" | "receipts" | "closing" | "price",
      value: string,
    ) => {
      if (field === "receipts" || field === "closing") {
        const body: Record<string, number> = {}
        body[field] = parseCommaInt(value)
        await api(`/api/ledger/today/${productId}`, {
          method: "PATCH",
          body,
        })
      } else {
        const body: Record<string, string | number> = {}
        if (field === "name") body.name = value
        else if (field === "unit") body.unit = value
        else if (field === "opening") body.stock = parseCommaInt(value)
        else if (field === "price") body.price = parseCommaInt(value)
        await api(`/api/products/${productId}`, {
          method: "PATCH",
          body,
        })
      }
      // Optimistic local update
      setRows((prev) =>
        prev.map((r) => {
          if (r.productId !== productId) return r
          const next = { ...r }
          if (field === "name") next.name = value
          else if (field === "unit") next.unit = value
          else if (field === "opening") next.opening = parseCommaInt(value)
          else if (field === "receipts") next.receipts = parseCommaInt(value)
          else if (field === "closing") next.closing = parseCommaInt(value) || null
          else if (field === "price") next.price = parseCommaInt(value)
          // Recompute totals
          next.total = next.opening + next.receipts
          next.sales = next.closing != null ? Math.max(0, next.total - next.closing) : null
          next.amount = next.sales != null ? next.sales * next.price : null
          return next
        }),
      )

      try {
        // Re-sync to ensure server state matches
        const [products, entries] = await Promise.all([
          api<ApiProduct[]>("/api/products"),
          api<ApiLedgerEntry[]>("/api/ledger/today"),
        ])
        setRows(merge(products ?? [], entries ?? []))
      } catch {
        // silent — the optimistic update already applied
      }
    },
    [],
  )

  const syncFromLastClosed = useCallback(async () => {
    const res = await api<{ synced_from: string }>("/api/ledger/sync-from-last-closed", {
      method: "POST",
    })
    await refresh()
    return res.synced_from
  }, [refresh])

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
      syncFromLastClosed,
    }),
    [rows, loading, error, refresh, addProduct, addProducts, patchCatalogField, removeProduct, syncFromLastClosed],
  )

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  )
}
