import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { api, ApiError, mutateWithOffline, errorMessage } from "@/lib/api"
import { queueMutation, removeMutation } from "@/lib/offlineQueue"
import type { ApiLedgerEntry, ApiProduct, TodayResponse } from "@/lib/types"
import { parseCommaInt } from "./format"
import { useToast } from "@/hooks/useToast"
import { ProductsContext } from "./productsContext"
import type { CatalogRow, NewProductForm } from "./types"
import { useAuth } from "@/hooks/useAuth"

function formatError(err: unknown): string {
  if (err instanceof ApiError && err.status >= 500) {
    return "A server error occurred. Please try again later."
  }
  return errorMessage(err, "Failed to load products")
}

function merge(products: ApiProduct[], entries: ApiLedgerEntry[]): CatalogRow[] {
  const safeProducts = Array.isArray(products) ? products : []
  const safeEntries = Array.isArray(entries) ? entries : []
  const byProduct = new Map<number, ApiLedgerEntry>()
  for (const e of safeEntries) {
    byProduct.set(e.product_id, e)
  }

  return safeProducts.map((p) => {
    const e = byProduct.get(p.id)
    const opening = e?.opening ?? p.stock
    const receipts = e?.receipts ?? 0
    const closing = e?.closing ?? null
    const price = e?.price ?? p.price
    const total = opening + receipts
    const sales = closing != null && closing >= 0 ? Math.max(0, total - closing) : 0
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
      effectiveThreshold: e?.effective_threshold ?? 12,
      currentStock: e?.current_stock ?? 0,
      isLowStock: e?.is_low_stock ?? false,
    }
  })
}

function todayEntries(ledger: TodayResponse | unknown): ApiLedgerEntry[] {
  if (Array.isArray(ledger)) return ledger
  if (ledger && typeof ledger === "object" && Array.isArray((ledger as TodayResponse).entries)) {
    return (ledger as TodayResponse).entries
  }
  return []
}

/** Temp ids are negative so they can never collide with real server ids. */
let tempSeq = 0
function nextTempId(): number {
  return -(++tempSeq)
}

/** Tracks offline-created (queued) products: tempId -> queued mutation id. */
const offlineCreates = new Map<number, string>()

function makeTempRow(productId: number, f: NewProductForm): CatalogRow {
  const opening = parseCommaInt(f.opening)
  const receipts = parseCommaInt(f.receipts)
  const closing = f.closing === "" ? null : parseCommaInt(f.closing)
  const price = parseCommaInt(f.price)
  const total = opening + receipts
  const sales = closing != null && closing >= 0 ? Math.max(0, total - closing) : 0
  const amount = sales * price
  const lowStockThreshold = f.lowStockThreshold ? parseCommaInt(f.lowStockThreshold) : null
  const currentStock = closing != null && closing >= 0 ? closing : total
  return {
    productId,
    name: f.name.trim(),
    opening,
    receipts,
    closing,
    price,
    total,
    sales,
    amount,
    lowStockThreshold,
    effectiveThreshold: lowStockThreshold ?? 12,
    currentStock,
    isLowStock: currentStock <= (lowStockThreshold ?? 12),
  }
}

function productBody(f: NewProductForm): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: f.name.trim(),
    opening: parseCommaInt(f.opening),
    receipts: parseCommaInt(f.receipts),
    closing: f.closing === "" ? null : parseCommaInt(f.closing),
    price: parseCommaInt(f.price),
  }
  if (f.lowStockThreshold) {
    body.low_stock_threshold = parseCommaInt(f.lowStockThreshold)
  }
  return body
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
      const [products, ledger] = await Promise.all([
        api<ApiProduct[]>("/api/products"),
        api<TodayResponse>("/api/ledger/today"),
      ])
      setRows(merge(products ?? [], todayEntries(ledger)))
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    void (async () => {
      try {
        const [products, ledger] = await Promise.all([
          api<ApiProduct[]>("/api/products"),
          api<TodayResponse>("/api/ledger/today"),
        ])
        if (!cancelled) {
          setRows(merge(products ?? [], todayEntries(ledger)))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatError(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  // Re-pull server truth once the offline queue has been fully replayed.
  useEffect(() => {
    function onSync() {
      void refresh()
    }
    function onSkipped(e: Event) {
      const n = (e as CustomEvent<{ skipped?: number }>).detail?.skipped ?? 0
      if (n > 0) {
        toast(`${n} offline change${n === 1 ? "" : "s"} couldn't be synced — please review`)
      }
    }
    window.addEventListener("app-data-sync", onSync)
    window.addEventListener("app-sync-skipped", onSkipped)
    return () => {
      window.removeEventListener("app-data-sync", onSync)
      window.removeEventListener("app-sync-skipped", onSkipped)
    }
  }, [refresh, toast])

  const addProduct = useCallback(
    async (form: NewProductForm) => {
      if (!form.name.trim()) return
      const body = productBody(form)
      try {
        await api<ApiProduct>("/api/products", { method: "POST", body })
        await refresh()
      } catch (err) {
        if (err instanceof ApiError) throw err
        const tempId = nextTempId()
        const mutationId = await queueMutation("/api/products", "POST", body, { tempId })
        offlineCreates.set(tempId, mutationId)
        setRows((prev) => [...prev, makeTempRow(tempId, form)])
      }
    },
    [refresh],
  )

  const addProducts = useCallback(
    async (forms: NewProductForm[]) => {
      const valid = forms.filter((f) => f.name.trim())
      if (valid.length === 0) return
      try {
        await api("/api/products", {
          method: "POST",
          body: {
            products: valid.map((f) => productBody(f)),
          },
        })
        await refresh()
      } catch (err) {
        if (err instanceof ApiError) throw err
        // Queue each product individually so single-create responses can
        // reconcile later queued edits that reference their temp ids.
        const tempRows: CatalogRow[] = []
        for (const f of valid) {
          const tempId = nextTempId()
          const mutationId = await queueMutation("/api/products", "POST", productBody(f), { tempId })
          offlineCreates.set(tempId, mutationId)
          tempRows.push(makeTempRow(tempId, f))
        }
        setRows((prev) => [...prev, ...tempRows])
      }
    },
    [refresh],
  )

  const patchCatalogField = useCallback(
    (
      productId: number,
      field: "name" | "opening" | "receipts" | "closing" | "price" | "low_stock_threshold",
      value: string,
    ) => {
      // Client-side validation: closing cannot exceed total (opening + receipts)
      const current = rows.find((r) => r.productId === productId)
      if (current) {
        let nextOpening = current.opening
        let nextReceipts = current.receipts
        let nextClosing = current.closing

        if (field === "opening") nextOpening = parseCommaInt(value)
        else if (field === "receipts") nextReceipts = parseCommaInt(value)
        else if (field === "closing") nextClosing = value === "" ? null : parseCommaInt(value)

        const nextTotal = nextOpening + nextReceipts
        if (nextClosing !== null && nextClosing > nextTotal) {
          toast("closing cannot exceed total (opening + receipts)")
          return
        }
      }

      setRows((prev) =>
        prev.map((r) => {
          if (r.productId !== productId) return r
          const next = { ...r }
          if (field === "name") next.name = value
          else if (field === "opening") next.opening = parseCommaInt(value)
          else if (field === "receipts") next.receipts = parseCommaInt(value)
          else if (field === "closing") next.closing = value === "" ? null : parseCommaInt(value)
          else if (field === "price") next.price = parseCommaInt(value)
          else if (field === "low_stock_threshold") {
            const n = parseCommaInt(value)
            next.lowStockThreshold = value === "" ? null : n
            next.effectiveThreshold = value === "" ? 12 : n
            next.isLowStock = next.currentStock <= next.effectiveThreshold
          }
          next.total = next.opening + next.receipts
          next.sales = next.closing != null && next.closing >= 0 ? Math.max(0, next.total - next.closing) : 0
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
              const body: Record<string, number | null> = {}
              body[field] = value === "" ? null : parseCommaInt(value)
              const r = await mutateWithOffline(`/api/ledger/today/${productId}`, "PATCH", body)
              ok = r !== null
            } else if (field === "name") {
              const r = await mutateWithOffline(`/api/products/${productId}`, "PATCH", { name: value })
              ok = r !== null
            }
            if (ok) {
              const [products, ledger] = await Promise.all([
                api<ApiProduct[]>("/api/products"),
                api<TodayResponse>("/api/ledger/today"),
              ])
              setRows(merge(products ?? [], todayEntries(ledger)))
            }
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              window.location.href = "/login"
              return
            }
            toast(formatError(err))
            void refresh()
          }
        }, 500),
      )
    },
    [rows, refresh, toast],
  )

  const removeProduct = useCallback(async (productId: number) => {
    const mutationId = offlineCreates.get(productId)
    if (mutationId != null) {
      // Offline-created product: cancel the queued create instead of
      // queueing a delete for an id the server has never seen.
      try {
        await removeMutation(mutationId)
      } catch {
        // already replayed — the id no longer exists; drop silently
      }
      offlineCreates.delete(productId)
    } else {
      await mutateWithOffline(`/api/products/${productId}`, "DELETE", undefined)
    }
    setRows((prev) => prev.filter((r) => r.productId !== productId))
  }, [])

  const removeProductsBulk = useCallback(async (productIds: number[]) => {
    const realIds: number[] = []
    for (const id of productIds) {
      const mutationId = offlineCreates.get(id)
      if (mutationId != null) {
        try {
          await removeMutation(mutationId)
        } catch {
          // ignore — already replayed
        }
        offlineCreates.delete(id)
      } else {
        realIds.push(id)
      }
    }
    if (realIds.length > 0) {
      await mutateWithOffline("/api/products/archive-bulk", "POST", { ids: realIds })
    }
    setRows((prev) => prev.filter((r) => !productIds.includes(r.productId)))
  }, [])

  const restoreProduct = useCallback(
    async (productId: number, row: CatalogRow) => {
      await mutateWithOffline(`/api/products/${productId}/restore`, "POST", undefined)
      setRows((prev) =>
        prev.some((r) => r.productId === productId) ? prev : [row, ...prev],
      )
    },
    [],
  )

  const fetchArchived = useCallback(async (): Promise<CatalogRow[]> => {
    const products = await api<ApiProduct[]>("/api/products/archived")
    return (products ?? []).map((p) => ({
      productId: p.id,
      name: p.name,
      opening: p.stock,
      receipts: 0,
      closing: null,
      price: p.price,
      total: p.stock,
      sales: 0,
      amount: 0,
      lowStockThreshold: p.low_stock_threshold,
      effectiveThreshold: 12,
      currentStock: p.stock,
      isLowStock: false,
    }))
  }, [])

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
      removeProductsBulk,
      restoreProduct,
      fetchArchived,
    }),
    [rows, loading, error, refresh, addProduct, addProducts, patchCatalogField, removeProduct, removeProductsBulk, restoreProduct, fetchArchived],
  )

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  )
}
