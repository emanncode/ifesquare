import { useEffect, useId, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { emptyForm } from "./productsContext"
import type { NewProductForm } from "./types"

type DraftRow = NewProductForm & { key: string }

function newRow(key: string): DraftRow {
  return { key, ...emptyForm }
}

type AddProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with every row that has a product name filled in. */
  onSubmit: (products: NewProductForm[]) => void
}

/**
 * Multi-product add dialog — stack several rows, then save them all at once.
 */
export function AddProductDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddProductDialogProps) {
  const baseId = useId()
  const [rows, setRows] = useState<DraftRow[]>(() => [
    newRow(`${baseId}-0`),
    newRow(`${baseId}-1`),
  ])

  // Reset to two empty rows whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setRows([newRow(`${baseId}-${Date.now()}-a`), newRow(`${baseId}-${Date.now()}-b`)])
    }
  }, [open, baseId])

  const validCount = rows.filter((r) => r.name.trim()).length

  function updateRow(key: string, patch: Partial<NewProductForm>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    )
  }

  function addRow() {
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
      .map(({ name, unit, stock, price }) => ({ name, unit, stock, price }))
    if (filled.length === 0) return
    onSubmit(filled)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="rounded-2xl">
          <Plus className="size-4" />
          Add products
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-4 sm:max-w-2xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add products</DialogTitle>
          <DialogDescription>
            Fill in one or more products, then add them all to your catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="rounded-2xl border border-border bg-muted/20 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Product {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove product row ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor={`${row.key}-name`}>Product name</Label>
                  <Input
                    id={`${row.key}-name`}
                    value={row.name}
                    onChange={(e) =>
                      updateRow(row.key, { name: e.target.value })
                    }
                    placeholder="e.g. Visco 2000 4L"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${row.key}-unit`}>Unit</Label>
                    <Input
                      id={`${row.key}-unit`}
                      value={row.unit}
                      onChange={(e) =>
                        updateRow(row.key, { unit: e.target.value })
                      }
                      placeholder="bottle, drum…"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${row.key}-stock`}>Starting stock</Label>
                    <Input
                      id={`${row.key}-stock`}
                      type="text"
                      inputMode="numeric"
                      value={row.stock}
                      onChange={(e) =>
                        updateRow(row.key, { stock: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${row.key}-price`}>Price (₦)</Label>
                    <Input
                      id={`${row.key}-price`}
                      type="text"
                      inputMode="numeric"
                      value={row.price}
                      onChange={(e) =>
                        updateRow(row.key, { price: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl border-dashed"
            onClick={addRow}
          >
            <Plus className="size-4" />
            Add another product
          </Button>
        </div>

        <DialogFooter className="gap-2 pt-1 sm:justify-between">
          <p className="text-xs text-muted-foreground sm:self-center">
            {validCount === 0
              ? "Enter at least one product name"
              : `${validCount} product${validCount === 1 ? "" : "s"} ready`}
          </p>
          <Button
            className="rounded-2xl font-semibold"
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
