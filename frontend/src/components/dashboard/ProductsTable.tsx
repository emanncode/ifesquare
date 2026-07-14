import type { ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { Card, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { nairaFmt } from "./format"
import { AddProductDialog } from "./AddProductDialog"
import type { DayEntry, LedgerRow, NewProductForm } from "./types"

type ProductsTableProps = {
  rows: LedgerRow[]
  addOpen: boolean
  onAddOpenChange: (open: boolean) => void
  newProduct: NewProductForm
  onNewProductChange: (value: NewProductForm) => void
  onAddProduct: () => void
  onUpdateEntry: (id: string, field: keyof DayEntry, value: string) => void
  onUpdatePrice: (id: string, price: string) => void
  onRemoveProduct: (id: string) => void
}

export function ProductsTable({
  rows,
  addOpen,
  onAddOpenChange,
  newProduct,
  onNewProductChange,
  onAddProduct,
  onUpdateEntry,
  onUpdatePrice,
  onRemoveProduct,
}: ProductsTableProps) {
  return (
    <Card hoverable={false} className="mb-6 overflow-hidden py-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <CardTitle className="text-base">Products</CardTitle>
        <AddProductDialog
          open={addOpen}
          onOpenChange={onAddOpenChange}
          value={newProduct}
          onChange={onNewProductChange}
          onSubmit={onAddProduct}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-215 border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <Th className="text-left">Product</Th>
              <Th>Unit</Th>
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
                key={r.id}
                className="border-b border-border/60 last:border-0 hover:bg-muted/30"
              >
                <Td className="text-left font-medium text-foreground">
                  {r.name}
                </Td>
                <Td className="text-muted-foreground">{r.unit}</Td>
                <Td align="right" className="text-muted-foreground">
                  {r.stock}
                </Td>
                <EditableTd
                  value={r.receiptsRaw}
                  onChange={(v) => onUpdateEntry(r.id, "receipts", v)}
                />
                <Td align="right" className="font-medium text-foreground">
                  {r.total}
                </Td>
                <EditableTd
                  value={r.closingRaw}
                  onChange={(v) => onUpdateEntry(r.id, "closing", v)}
                  placeholder="—"
                />
                <Td align="right" className="font-semibold text-primary">
                  {r.sales ?? "—"}
                </Td>
                <EditableTd
                  value={String(r.price)}
                  onChange={(v) => onUpdatePrice(r.id, v)}
                />
                <Td align="right" className="font-semibold text-foreground">
                  {nairaFmt(r.amount)}
                </Td>
                <Td align="right">
                  <button
                    onClick={() => onRemoveProduct(r.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${r.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Td>
              </tr>
            ))}
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
        "px-3 py-2.5 font-medium",
        align === "right" && "text-right",
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
        "px-3 py-2.5",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  )
}

function EditableTd({
  value,
  onChange,
  placeholder = "0",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <td className="px-3 py-2.5 text-right">
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-dashed border-border bg-transparent text-right text-sm text-foreground outline-none transition-colors focus:border-solid focus:border-primary"
      />
    </td>
  )
}
