import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { CardTitle } from "@/components/ui/CardTitle"
import { fmtInt, nairaFmt } from "./format"
import { AddProductDialog } from "./AddProductDialog"
import { useProducts } from "./useProducts"
import { CatalogTh } from "./CatalogTh"
import { CatalogTd } from "./CatalogTd"
import { CatalogNumericTd } from "./CatalogNumericTd"
import { CatalogEditableTextTd } from "./CatalogEditableTextTd"
import type { NewProductForm } from "./types"

type Field = "name" | "unit" | "opening" | "receipts" | "closing" | "price"

export function ProductsCatalog() {
  const { rows, loading, error, addProducts, patchCatalogField, removeProduct } =
    useProducts()
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

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
              <CatalogTh className="text-left">Product</CatalogTh>
              <CatalogTh className="text-left">Unit</CatalogTh>
              <CatalogTh align="right">Opening</CatalogTh>
              <CatalogTh align="right">Receipts</CatalogTh>
              <CatalogTh align="right">Total</CatalogTh>
              <CatalogTh align="right">Closing</CatalogTh>
              <CatalogTh align="right">Sales</CatalogTh>
              <CatalogTh align="right">Price</CatalogTh>
              <CatalogTh align="right">Amount</CatalogTh>
              <CatalogTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
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
