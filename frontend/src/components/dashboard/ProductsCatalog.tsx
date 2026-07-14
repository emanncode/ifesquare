import { useState, type ReactNode } from "react"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"
import { Card, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { fmtInt, nairaFmt } from "./format"
import { AddProductDialog } from "./AddProductDialog"
import { useProducts } from "./useProducts"
import type { NewProductForm } from "./types"

type Field = "name" | "unit" | "opening" | "receipts" | "closing" | "price"

export function ProductsCatalog() {
  const { rows, loading, error, addProducts, patchCatalogField, removeProduct, syncFromLastClosed } =
    useProducts()
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncedOnce, setSyncedOnce] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

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
    setSyncMsg(null)
    setSyncedOnce(false)
    try {
      await patchCatalogField(productId, field, value)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update")
    }
  }

  async function handleSync() {
    setSyncing(true)
    setActionError(null)
    setSyncMsg(null)
    try {
      const from = await syncFromLastClosed()
      setSyncedOnce(true)
      setSyncMsg(`Synced from ${from}`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to sync")
    } finally {
      setSyncing(false)
    }
  }

  async function handleRemove(productId: number) {
    setActionError(null)
    setSyncMsg(null)
    setSyncedOnce(false)
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
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing || syncedOnce}
            className="inline-flex h-9 items-center gap-1.5 rounded-2xl border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
            {syncing ? "Syncing…" : "Sync last closed"}
          </button>
          <AddProductDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={(forms) => void handleAddMany(forms)}
          />
        </div>
      </div>

      {syncMsg && (
        <div className="border-b border-primary/30 bg-primary/8 px-5 py-3 text-sm text-primary">
          {syncMsg}
        </div>
      )}
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
              <Th className="text-left">Product</Th>
              <Th className="text-left">Unit</Th>
              <Th align="right">Opening</Th>
              <Th align="right">Receipts</Th>
              <Th align="right">Total</Th>
              <Th align="right">Closing</Th>
              <Th align="right">Sales</Th>
              <Th align="right">Price</Th>
              <Th align="right">Amount</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.productId}
                className="border-b border-border/60 last:border-0 hover:bg-muted/30"
              >
                <EditableTextTd
                  value={r.name}
                  onChange={(v) => void handlePatch(r.productId, "name", v)}
                  className="text-left font-medium text-foreground"
                  align="left"
                />
                <EditableTextTd
                  value={r.unit}
                  onChange={(v) => void handlePatch(r.productId, "unit", v)}
                  className="text-muted-foreground"
                />
                <NumericTd
                  value={String(r.opening)}
                  onChange={(v) => void handlePatch(r.productId, "opening", v)}
                />
                <NumericTd
                  value={String(r.receipts)}
                  onChange={(v) => void handlePatch(r.productId, "receipts", v)}
                />
                <Td align="right" className="tabular-nums font-medium text-foreground">
                  {fmtInt(r.total)}
                </Td>
                <NumericTd
                  value={r.closing != null ? String(r.closing) : ""}
                  onChange={(v) => void handlePatch(r.productId, "closing", v)}
                  placeholder="—"
                />
                <Td align="right" className="tabular-nums font-semibold text-foreground">
                  {r.sales == null ? "—" : fmtInt(r.sales)}
                </Td>
                <NumericTd
                  value={String(r.price)}
                  onChange={(v) => void handlePatch(r.productId, "price", v)}
                />
                <Td align="right" className="tabular-nums font-bold text-primary">
                  {r.amount == null ? "—" : nairaFmt(r.amount)}
                </Td>
                <Td align="right">
                  <button
                    type="button"
                    onClick={() => void handleRemove(r.productId)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${r.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Td>
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

function Th({
  children,
  align = "center",
  className,
}: {
  children?: ReactNode
  align?: "left" | "right" | "center"
  className?: string
}) {
  return (
    <th
      className={cn(
        "h-14 px-4 py-4 font-medium",
        align === "right" && "text-right",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode
  align?: "left" | "right"
  className?: string
}) {
  return (
    <td
      className={cn(
        "h-14 px-4 py-4",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  )
}

function NumericTd({
  value,
  onChange,
  placeholder = "0",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <td className="h-14 px-4 py-4 text-right">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full border-b border-dashed border-border bg-transparent text-right text-sm text-foreground outline-none transition-colors focus:border-solid focus:border-primary"
      />
    </td>
  )
}

function EditableTextTd({
  value,
  onChange,
  className,
  align = "center",
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  align?: "left" | "right" | "center"
}) {
  return (
    <td
      className={cn(
        "h-14 px-4 py-4",
        align === "right" && "text-right",
        align === "left" && "text-left",
        className,
      )}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full min-w-24 border-b border-dashed border-border bg-transparent text-sm outline-none transition-colors focus:border-solid focus:border-primary",
          align === "right" && "text-right",
          align === "left" && "text-left",
          align === "center" && "text-center",
        )}
      />
    </td>
  )
}
