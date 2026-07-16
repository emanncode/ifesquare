import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { CardTitle } from "@/components/ui/CardTitle"
import { fmtInt, nairaFmt } from "./format"
import { AddProductDialog } from "./AddProductDialog"
import { useProducts } from "./useProducts"
import { CatalogTh } from "./CatalogTh"
import { CatalogTd } from "./CatalogTd"
import { CatalogNumericTd } from "./CatalogNumericTd"
import { CatalogEditableTextTd } from "./CatalogEditableTextTd"
import { cn } from "@/lib/utils"
import type { CatalogRow, NewProductForm } from "./types"

type Field = "name" | "unit" | "opening" | "receipts" | "closing" | "price"

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
]

export function ProductsCatalog() {
  const { rows, loading, error, addProducts, patchCatalogField, removeProduct } =
    useProducts()
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const sorted = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir])

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
    setActionError(null)
    try {
      await addProducts(forms)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add products")
    } finally {
      setBusy(false)
    }
  }

  async function handlePatch(productId: number, field: Field, value: string) {
    setActionError(null)
    try {
      await patchCatalogField(productId, field, value)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update")
    }
  }

  async function handleRemove(productId: number) {
    setActionError(null)
    try {
      await removeProduct(productId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to remove")
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
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <CardTitle className="text-base">Products</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Synced with the server catalog
            {busy ? " · saving…" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddProductDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={(forms) => void handleAddMany(forms)}
          />
        </div>
      </div>

      {(error || actionError) && (
        <div
          role="alert"
          className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive"
        >
          {actionError ?? error}
        </div>
      )}

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
                className="border-b border-border/60 last:border-0 hover:bg-muted/30"
              >
                <CatalogEditableTextTd
                  value={r.name}
                  onChange={(v) => void handlePatch(r.productId, "name", v)}
                  className="text-left font-medium text-foreground"
                  align="left"
                />
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
                  colSpan={10}
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
