import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Wallet, Package, Cylinder, AlertTriangle, Loader2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { ProductsTable } from "@/components/dashboard/ProductsTable"
import { InsightsCard } from "@/components/dashboard/InsightsCard"
import { fmtInt, nairaFmt } from "@/components/dashboard/format"
import { useAppShell } from "@/components/layout/appShell"
import { useLedger } from "@/hooks/useLedger"
import { useToast } from "@/hooks/useToast"

export default function DashboardPage() {
  const { openMobileNav } = useAppShell()
  const { rows, loading, error, lastUpdated, refresh, closeDay } = useLedger()
  const { toast } = useToast()
  const [closeOpen, setCloseOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (error) toast(error)
  }, [error, toast])

  const totalRevenue = rows.reduce((s, r) => s + (r.amount ?? 0), 0)
  const totalUnits = rows.reduce((s, r) => s + (r.sales ?? 0), 0)
  const topProduct = rows.reduce(
    (top, r) => ((r.amount ?? 0) > (top?.amount ?? 0) ? r : top),
    rows[0],
  )
  const lowStockCount = rows.filter((r) => r.isLowStock).length

  async function handleRefresh() {
    await refresh()
  }

  async function confirmCloseDay() {
    setClosing(true)
    try {
      await closeDay()
      setCloseOpen(false)
      toast("Day closed successfully", "success")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to close day")
    } finally {
      setClosing(false)
    }
  }

  const barData = rows
    .filter((r) => (r.amount ?? 0) > 0)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
    .map((r) => ({ name: r.name, Amount: Math.round(r.amount ?? 0) }))

  const pieData = rows
    .filter((r) => (r.amount ?? 0) > 0)
    .map((r) => ({ name: r.name, value: Math.round(r.amount ?? 0) }))

  const lineData = useMemo(
    () => [
      { date: "Mon", Revenue: Math.round(totalRevenue * 0.72) },
      { date: "Tue", Revenue: Math.round(totalRevenue * 0.81) },
      { date: "Wed", Revenue: Math.round(totalRevenue * 0.64) },
      { date: "Thu", Revenue: Math.round(totalRevenue * 0.9) },
      { date: "Fri", Revenue: Math.round(totalRevenue * 0.95) },
      { date: "Today", Revenue: Math.round(totalRevenue) },
    ],
    [totalRevenue],
  )

  const revenueSpark = [
    0.55,
    0.62,
    0.48,
    0.7,
    0.78,
    0.85,
    Math.max(0.4, Math.min(1, totalRevenue / 80000 || 0.5)),
  ]

  if (loading) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading ledger"
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="mx-auto p-[5%] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <DashboardHeader
        lastUpdated={lastUpdated}
        closeOpen={closeOpen}
        onCloseOpenChange={setCloseOpen}
        onConfirmClose={() => void confirmCloseDay()}
        onRefresh={() => void handleRefresh()}
        onMenuClick={openMobileNav}
      />

      {closing && (
        <p className="mb-4 text-sm text-muted-foreground">Closing day…</p>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:grid sm:grid-cols-4 sm:gap-5">
        <MetricCard
          label="Today's revenue"
          value={nairaFmt(totalRevenue)}
          icon={Wallet}
          accent
          trend={totalRevenue > 0 ? "From closed counts" : "No sales yet"}
          sparkline={revenueSpark}
        />
        <MetricCard
          label="Units sold"
          value={fmtInt(totalUnits)}
          icon={Package}
        />
        <MetricCard
          label="Top product"
          value={topProduct?.amount ? topProduct.name : "—"}
          icon={Cylinder}
          small
        />
        <MetricCard
          label="Low stock"
          value={lowStockCount > 0 ? String(lowStockCount) : "All stocked"}
          icon={AlertTriangle}
          accent={lowStockCount > 0}
          trend={lowStockCount > 0 ? "Products need attention" : undefined}
          onClick={() => navigate("/app/products?filter=low-stock")}
        />
      </div>

      <ProductsTable rows={rows} />

      <InsightsCard
        barData={barData}
        pieData={pieData}
        lineData={lineData}
        totalRevenue={totalRevenue}
        totalUnits={totalUnits}
      />
    </motion.div>
  )
}
