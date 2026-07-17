import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Trash2, AlertTriangle, X } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { CardTitle } from "@/components/ui/CardTitle"
import { fmtInt, nairaFmt, formatWithCommas, stripNonDigits } from "./format"
import { AddProductDialog } from "./AddProductDialog"
import { useProducts } from "./useProducts"
import { CatalogTh } from "./CatalogTh"
import { CatalogTd } from "./CatalogTd"
import { CatalogNumericTd } from "./CatalogNumericTd"
import { CatalogEditableTextTd } from "./CatalogEditableTextTd"
import { useToast } from "@/hooks/useToast"
import { cn } from "@/lib/utils"
import type { CatalogRow, NewProductForm } from "./types"

type Field = "name" | "unit" | "opening" | "receipts" | "closing" | "price" | "low_stock_threshold"

type SortKey = keyof CatalogRow
type SortDir = "asc" | "desc"

function sortRows(data: CatalogRow[], key: SortKey, dir: SortDir): CatalogRow[] {
  return [...data].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    const an = va ?? (typeof va === "number" ? 0 : "")
    const bn = vb ?? (typeof vb === "number" ? 0 : "")
    const cmp = typeof an === "number" && typeof bn === "number"
      ? an - bn
      : String(an).localeCompare(String(bn))
    return dir === "asc" ? cmp : -cmp
  })
}

const SORTABLE_COLUMNS: { key: SortKey; label: string; align?: "left" | "right" }[] = [
  { key: "name", label: "Product", align: "left" },
  { key: "unit", label: "Unit", align: "left" },
  { key: "opening", label: "Opening", align: "right" },
  { key: "receipts", label: "Receipts", align: "right" },
  { key: "total", label: "Total", align: "right" },
  { key: "closing", label: "Closing", align: "right" },
  { key: "sales", label: "Sales", align: "right" },
  { key: "price", label: "Price", align: "right" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "lowStockThreshold", label: "Alert at", align: "right" },
]

export function ProductsCatalog() {
  const { rows, loading, error, addProducts, patchCatalogField, removeProduct } =
    useProducts()
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [searchParams, setSearchParams] = useSearchParams()
  const [lowStockOnly, setLowStockOnly] = useState(() => searchParams.get("filter") === "low-stock")

  useEffect(() => {
    if (searchParams.get("filter") === "low-stock") {
      setLowStockOnly(true)
    }
  }, [searchParams])

  function toggleLowStockFilter() {
    const next = !lowStockOnly
    setLowStockOnly(next)
    if (next) {
      setSearchParams({ filter: "low-stock" })
    } else {
      setSearchParams({})
    }
  }

  useEffect(() => {
    if (error) toast(error)
  }, [error, toast])

  const filteredRows = useMemo(
    () => (lowStockOnly ? rows.filter((r) => r.isLowStock) : rows),
    [rows, lowStockOnly],
  )
  const sorted = useMemo(() => sortRows(filteredRows, sortKey, sortDir), [filteredRows, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  async function handleAddMany(forms: NewProductForm[]) {
    setBusy(true)
    try {
      await addProducts(forms)
      toast("Products added", "success")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add products")
    } finally {
      setBusy(false)
    }
  }

  async function handlePatch(productId: number, field: Field, value: string) {
    try {
      await patchCatalogField(productId, field, value)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update")
    }
  }

  async function handleRemove(productId: number) {
    try {
      await removeProduct(productId)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to remove")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card hoverable={false} className="overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Products</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Synced with the server catalog
              {busy ? " · saving…" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLowStockFilter}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                lowStockOnly
                  ? "bg-amber-500/12 text-amber-700 dark:text-amber-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              <AlertTriangle className="size-3.5" />
              Low stock only
            </button>
            <AddProductDialog
              open={addOpen}
              onOpenChange={setAddOpen}
              onSubmit={(forms) => void handleAddMany(forms)}
            />
          </div>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              {SORTABLE_COLUMNS.map((col) => {
                const active = sortKey === col.key
                const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
                return (
                  <CatalogTh key={col.key} className={col.align === "left" ? "text-left" : ""}>
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                        active && "text-foreground",
                      )}
                    >
                      {col.label}
                      <Icon className="size-3" />
                    </button>
                  </CatalogTh>
                )
              })}
              <CatalogTh />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.productId}
                className={cn(
                  "border-b border-border/60 last:border-0 hover:bg-muted/30",
                  r.isLowStock && "border-l-2 border-l-amber-500 bg-amber-500/4",
                )}
              >
                <CatalogTd className="text-left font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={r.name}
                      onChange={(e) => void handlePatch(r.productId, "name", e.target.value)}
                      className="h-9 min-w-24 border-b border-dashed border-border bg-transparent text-sm font-medium text-foreground outline-none transition-colors focus:border-solid focus:border-primary"
                    />
                    {r.isLowStock && (
                      <span className="inline-flex shrink-0 items-center rounded-lg bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Low stock
                      </span>
                    )}
                  </div>
                </CatalogTd>
                <CatalogEditableTextTd
                  value={r.unit}
                  onChange={(v) => void handlePatch(r.productId, "unit", v)}
                  className="text-muted-foreground"
                />
                <CatalogNumericTd
                  value={String(r.opening)}
                  onChange={(v) => void handlePatch(r.productId, "opening", v)}
                />
                <CatalogNumericTd
                  value={String(r.receipts)}
                  onChange={(v) => void handlePatch(r.productId, "receipts", v)}
                />
                <CatalogTd align="right" className="tabular-nums font-medium text-foreground">
                  {fmtInt(r.total)}
                </CatalogTd>
                <CatalogNumericTd
                  value={r.closing != null ? String(r.closing) : ""}
                  onChange={(v) => void handlePatch(r.productId, "closing", v)}
                  placeholder="—"
                />
                <CatalogTd align="right" className="tabular-nums font-semibold text-foreground">
                  {fmtInt(r.sales)}
                </CatalogTd>
                <CatalogNumericTd
                  value={String(r.price)}
                  onChange={(v) => void handlePatch(r.productId, "price", v)}
                />
                <CatalogTd align="right" className="tabular-nums font-bold text-primary">
                  {r.amount == null ? "—" : nairaFmt(r.amount)}
                </CatalogTd>
                <CatalogTd align="right">
                  <AlertAtInput
                    productId={r.productId}
                    lowStockThreshold={r.lowStockThreshold}
                    effectiveThreshold={r.effectiveThreshold}
                    onChange={(v) => void handlePatch(r.productId, "low_stock_threshold", v)}
                  />
                </CatalogTd>
                <CatalogTd align="right">
                  <button
                    type="button"
                    onClick={() => void handleRemove(r.productId)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${r.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </CatalogTd>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No products yet. Add your first product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function AlertAtInput({
  lowStockThreshold,
  effectiveThreshold,
  onChange,
}: {
  lowStockThreshold: number | null
  effectiveThreshold: number
  onChange: (v: string) => void
}) {
  const [display, setDisplay] = useState(() => String(effectiveThreshold))

  useEffect(() => {
    setDisplay(lowStockThreshold != null ? String(lowStockThreshold) : String(effectiveThreshold))
  }, [lowStockThreshold, effectiveThreshold])

  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digits = stripNonDigits(e.target.value)
          setDisplay(digits)
          onChange(digits)
        }}
        className={cn(
          "h-9 w-16 border-b border-dashed border-border bg-transparent text-right text-sm outline-none transition-colors focus:border-solid focus:border-primary",
          lowStockThreshold == null ? "text-muted-foreground" : "text-foreground",
        )}
      />
      {lowStockThreshold == null ? (
        <span className="text-[10px] text-muted-foreground">(default)</span>
      ) : (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Reset to default"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
