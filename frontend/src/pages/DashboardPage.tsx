import { useMemo, useState } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { ProductsTable } from "@/components/dashboard/ProductsTable"
import { InsightsCard } from "@/components/dashboard/InsightsCard"
import { nairaFmt } from "@/components/dashboard/format"
import { seedEntries, seedProducts } from "@/components/dashboard/seed"
import type { DayEntry, NewProductForm } from "@/components/dashboard/types"

export default function DashboardPage() {
  const [products, setProducts] = useState(seedProducts)
  const [entries, setEntries] = useState(seedEntries)
  const [addOpen, setAddOpen] = useState(false)
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    unit: "",
    stock: "",
    price: "",
  })

  const rows = useMemo(
    () =>
      products.map((p) => {
        const e = entries[p.id] ?? { receipts: "", closing: "" }
        const receipts = e.receipts === "" ? 0 : Number(e.receipts)
        const total = p.stock + receipts
        const hasClosing = e.closing !== ""
        const closing = hasClosing ? Number(e.closing) : null
        const sales = hasClosing ? Math.max(0, total - (closing ?? 0)) : null
        const amount = sales != null ? sales * p.price : null
        return {
          ...p,
          receiptsRaw: e.receipts,
          closingRaw: e.closing,
          total,
          sales,
          amount,
        }
      }),
    [products, entries],
  )

  const totalRevenue = rows.reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalUnits = rows.reduce((s, r) => s + (r.sales ?? 0), 0)
  const topProduct = rows.reduce(
    (top, r) => ((r.amount ?? 0) > (top?.amount ?? 0) ? r : top),
    rows[0],
  )

  function updateEntry(id: string, field: keyof DayEntry, value: string) {
    setEntries((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  function updatePrice(id: string, price: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: Number(price) || 0 } : p)),
    )
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function addProduct() {
    if (!newProduct.name.trim()) return
    const id = `p_${Date.now()}`
    setProducts((prev) => [
      ...prev,
      {
        id,
        name: newProduct.name.trim(),
        unit: newProduct.unit.trim() || "unit",
        stock: Number(newProduct.stock) || 0,
        price: Number(newProduct.price) || 0,
      },
    ])
    setNewProduct({ name: "", unit: "", stock: "", price: "" })
    setAddOpen(false)
  }

  const barData = rows
    .filter((r) => (r.amount ?? 0) > 0)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
    .map((r) => ({ name: r.name, Amount: Math.round(r.amount ?? 0) }))

  const pieData = rows
    .filter((r) => (r.amount ?? 0) > 0)
    .map((r) => ({ name: r.name, value: Math.round(r.amount ?? 0) }))

  // Trend data would come from /api/history — placeholder shape until wired up.
  const lineData = [
    { date: "Mon", Revenue: 38200 },
    { date: "Tue", Revenue: 41500 },
    { date: "Wed", Revenue: 29800 },
    { date: "Thu", Revenue: 46100 },
    { date: "Fri", Revenue: 52400 },
    { date: "Today", Revenue: Math.round(totalRevenue) },
  ]

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto p-[5%] px-8 py-8">
          <DashboardHeader />

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Today's revenue"
              value={nairaFmt(totalRevenue)}
              accent
            />
            <MetricCard label="Units sold" value={String(totalUnits)} />
            <MetricCard
              label="Top product"
              value={topProduct?.amount ? topProduct.name : "—"}
              small
            />
          </div>

          <ProductsTable
            rows={rows}
            addOpen={addOpen}
            onAddOpenChange={setAddOpen}
            newProduct={newProduct}
            onNewProductChange={setNewProduct}
            onAddProduct={addProduct}
            onUpdateEntry={updateEntry}
            onUpdatePrice={updatePrice}
            onRemoveProduct={removeProduct}
          />

          <InsightsCard
            barData={barData}
            pieData={pieData}
            lineData={lineData}
          />
        </div>
      </main>
    </div>
  )
}
