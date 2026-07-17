import { useEffect, useId, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/Dialog"
import { DialogContent } from "@/components/ui/DialogContent"
import { DialogDescription } from "@/components/ui/DialogDescription"
import { DialogFooter } from "@/components/ui/DialogFooter"
import { DialogHeader } from "@/components/ui/DialogHeader"
import { DialogTitle } from "@/components/ui/DialogTitle"
import { DialogTrigger } from "@/components/ui/DialogTrigger"
import { NumericInput } from "./NumericInput"
import { emptyForm } from "./productsContext"
import type { NewProductForm } from "./types"

const MAX_PRODUCTS = 16
const INITIAL_COUNT = 4

type DraftRow = NewProductForm & { key: string }

function newRow(key: string): DraftRow {
  return { key, ...emptyForm }
}

type AddProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (products: NewProductForm[]) => void
}

export function AddProductDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddProductDialogProps) {
  const baseId = useId()
  const [rows, setRows] = useState<DraftRow[]>(() =>
    Array.from({ length: INITIAL_COUNT }, (_, i) => newRow(`${baseId}-${i}`)),
  )

  useEffect(() => {
    if (open) {
      setRows(
        Array.from({ length: INITIAL_COUNT }, (_, i) =>
          newRow(`${baseId}-${Date.now()}-${i}`),
        ),
      )
    }
  }, [open, baseId])

  const validCount = rows.filter((r) => r.name.trim()).length
  const atMax = rows.length >= MAX_PRODUCTS

  function updateRow(key: string, patch: Partial<NewProductForm>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    )
  }

  function addRow() {
    if (atMax) return
    setRows((prev) => [...prev, newRow(`${baseId}-${Date.now()}`)])
  }

  function removeRow(key: string) {
    setRows((prev) => {
      if (prev.length <= 1) {
        return [newRow(`${baseId}-${Date.now()}`)]
      }
      return prev.filter((r) => r.key !== key)
    })
  }

  function handleSubmit() {
    const filled = rows
      .filter((r) => r.name.trim())
      .map(({ name, unit, stock, price, lowStockThreshold }) => {
        const p: NewProductForm = { name, unit, stock, price }
        if (lowStockThreshold) p.lowStockThreshold = lowStockThreshold
        return p
      })
    if (filled.length === 0) return
    onSubmit(filled)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="rounded-xl">
          <Plus className="size-4" />
          Add products
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-4 sm:max-w-7xl sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>Add products</DialogTitle>
          <DialogDescription>
            Fill in up to {MAX_PRODUCTS} products, then add them all to your
            catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 pt-1">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="relative rounded-xl border border-border bg-muted/20 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  #{index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove product ${index + 1}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label
                    htmlFor={`${row.key}-name`}
                    className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Name
                  </Label>
                  <Input
                    id={`${row.key}-name`}
                    value={row.name}
                    onChange={(e) =>
                      updateRow(row.key, { name: e.target.value })
                    }
                    placeholder="e.g. Visco 4L"
                    className="h-8 text-sm"
                  />
                </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="grid gap-1">
                      <Label
                        htmlFor={`${row.key}-unit`}
                        className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        Unit
                      </Label>
                      <Input
                        id={`${row.key}-unit`}
                        value={row.unit ?? ""}
                        onChange={(e) =>
                          updateRow(row.key, { unit: e.target.value })
                        }
                        placeholder="bottle"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label
                        htmlFor={`${row.key}-stock`}
                        className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        Stock
                      </Label>
                      <NumericInput
                        id={`${row.key}-stock`}
                        value={row.stock}
                        onChange={(v) => updateRow(row.key, { stock: v })}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label
                        htmlFor={`${row.key}-price`}
                        className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        Price
                      </Label>
                      <NumericInput
                        id={`${row.key}-price`}
                        value={row.price}
                        onChange={(v) => updateRow(row.key, { price: v })}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label
                        htmlFor={`${row.key}-alert`}
                        className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        Alert below
                      </Label>
                      <NumericInput
                        id={`${row.key}-alert`}
                        value={row.lowStockThreshold ?? ""}
                        onChange={(v) => updateRow(row.key, { lowStockThreshold: v })}
                        placeholder="10 (default)"
                      />
                    </div>
                  </div>
              </div>
            </div>
          ))}
        </div>

        {!atMax && (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-dashed"
            onClick={addRow}
          >
            <Plus className="size-4" />
            Add another product
          </Button>
        )}

        <DialogFooter className="gap-2 pt-1 sm:justify-between">
          <p className="text-xs text-muted-foreground sm:self-center">
            {validCount === 0
              ? "Enter at least one product name"
              : `${validCount} of ${MAX_PRODUCTS} product${validCount === 1 ? "" : "s"} ready`}
          </p>
          <Button
            className="rounded-xl font-semibold"
            onClick={handleSubmit}
            disabled={validCount === 0}
          >
            Add {validCount > 0 ? validCount : ""} product
            {validCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
