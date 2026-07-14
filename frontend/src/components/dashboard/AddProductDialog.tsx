import { Plus } from "lucide-react"
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
} from "@/components/ui/dialog"
import type { NewProductForm } from "./types"

type AddProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: NewProductForm
  onChange: (value: NewProductForm) => void
  onSubmit: () => void
}

export function AddProductDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onSubmit,
}: AddProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" />
          Add product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="grid gap-1.5">
            <Label htmlFor="np-name">Product name</Label>
            <Input
              id="np-name"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              placeholder="e.g. Visco 2000 4L"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="np-unit">Unit</Label>
              <Input
                id="np-unit"
                value={value.unit}
                onChange={(e) => onChange({ ...value, unit: e.target.value })}
                placeholder="bottle, drum…"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-stock">Starting stock</Label>
              <Input
                id="np-stock"
                type="number"
                value={value.stock}
                onChange={(e) => onChange({ ...value, stock: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-price">Price (₦)</Label>
            <Input
              id="np-price"
              type="number"
              value={value.price}
              onChange={(e) => onChange({ ...value, price: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button onClick={onSubmit}>Add product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
