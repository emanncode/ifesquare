import { motion } from "framer-motion"
import { useState } from "react"
import { Loader2, Menu } from "lucide-react"
import { useAppShell } from "@/components/layout/appShell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/Card"
import { CardTitle } from "@/components/ui/CardTitle"
import { fmtInt, nairaFmt, parseCommaInt } from "@/components/dashboard/format"
import { HistoryEditableTd } from "@/components/dashboard/HistoryEditableTd"
import { useHistory } from "@/hooks/useHistory"
import { api } from "@/lib/api"
import type { ApiHistoryDayDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
  const { openMobileNav } = useAppShell()
  const { days, loading, error, getDay } = useHistory()
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<ApiHistoryDayDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)

  async function openDay(date: string) {
    if (date === selected) {
      setSelected(null)
      setDetail(null)
      return
    }
    setSelected(date)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const data = await getDay(date)
      setDetail(data)
    } catch (err) {
      setDetail(null)
      setDetailError(err instanceof Error ? err.message : "Failed to load day")
    } finally {
      setDetailLoading(false)
    }
  }

  async function patchEntry(
    productId: number,
    field: "opening" | "receipts" | "closing" | "price",
    raw: string,
  ) {
    if (!detail) return
    await api(`/api/ledger/${detail.date}/${productId}`, {
      method: "PATCH",
      body: { [field]: parseCommaInt(raw) },
    })
    // Refresh detail
    const data = await getDay(detail.date)
    setDetail(data)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="mx-auto p-[5%] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl lg:hidden"
          onClick={openMobileNav}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Past closed ledger days from the server
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {!loading && !error && days.length === 0 && (
        <Card
          hoverable={false}
          className="flex min-h-40 items-center justify-center rounded-xl py-8 sm:rounded-xl"
        >
          <p className="text-sm text-muted-foreground">
            No closed days yet. Close today&apos;s ledger to see it here.
          </p>
        </Card>
      )}

      {!loading && days.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] items-start">
          <Card hoverable={false} className="overflow-hidden py-0">
            <div className="border-b border-border px-5 py-4">
              <CardTitle className="text-base">Closed days</CardTitle>
            </div>
            <ul className="divide-y divide-border">
              {days.map((d) => (
                <li key={d.date}>
                  <button
                    type="button"
                    onClick={() => void openDay(d.date)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40",
                      selected === d.date && "bg-primary/8",
                    )}
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {formatDate(d.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Closed{" "}
                        {new Date(d.closed_at).toLocaleString("en-NG", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {nairaFmt(d.total_revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtInt(d.total_units)} units
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card hoverable={false} className="overflow-hidden py-0">
            <div className="border-b border-border px-5 py-4">
              <CardTitle className="text-base">
                {selected ? formatDate(selected) : "Day detail"}
              </CardTitle>
            </div>
            <div className="p-5">
              {!selected && (
                <p className="text-sm text-muted-foreground">
                  Select a closed day to see line items.
                </p>
              )}
              {detailLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {detailError && (
                <p className="text-sm text-destructive">{detailError}</p>
              )}
              {detail && !detailLoading && (
                <div className="overflow-x-auto">
                  {detail.date === today && (
                    <p className="mb-3 text-xs text-muted-foreground">
                      This is today&apos;s closed ledger. Edit values on the{" "}
                      <a href="/app/products" className="underline hover:text-foreground">Products</a> page.
                    </p>
                  )}
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-2 py-2 text-left font-semibold">Product</th>
                        <th className="px-2 py-2 text-right font-semibold">Opening</th>
                        <th className="px-2 py-2 text-right font-semibold">Receipts</th>
                        <th className="px-2 py-2 text-right font-semibold">Total</th>
                        <th className="px-2 py-2 text-right font-semibold">Closing</th>
                        <th className="px-2 py-2 text-right font-semibold">Sales</th>
                        <th className="px-2 py-2 text-right font-semibold">Price</th>
                        <th className="px-2 py-2 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.entries.map((e) => {
                        const total = e.opening + e.receipts
                        const sales = e.closing != null && e.closing > 0 ? Math.max(0, total - e.closing) : 0
                        const amount = sales * e.price
                        const isToday = detail.date === today
                        return (
                          <tr
                            key={e.id}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="px-2 py-3 font-medium text-foreground">
                              {e.product_name}
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {e.product_unit}
                              </span>
                            </td>
                            {isToday ? (
                              <>
                                <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{fmtInt(e.opening)}</td>
                                <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{fmtInt(e.receipts)}</td>
                              </>
                            ) : (
                              <>
                                <HistoryEditableTd value={e.opening} onChange={(v) => void patchEntry(e.product_id, "opening", v)} />
                                <HistoryEditableTd value={e.receipts} onChange={(v) => void patchEntry(e.product_id, "receipts", v)} />
                              </>
                            )}
                            <td className="px-2 py-3 text-right tabular-nums font-medium text-foreground">
                              {fmtInt(total)}
                            </td>
                            {isToday ? (
                              <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{e.closing == null ? "—" : fmtInt(e.closing)}</td>
                            ) : (
                              <HistoryEditableTd value={e.closing} onChange={(v) => void patchEntry(e.product_id, "closing", v)} placeholder="—" />
                            )}
                            <td className="px-2 py-3 text-right tabular-nums font-semibold text-foreground">
                              {fmtInt(sales)}
                            </td>
                            {isToday ? (
                              <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{nairaFmt(e.price)}</td>
                            ) : (
                              <HistoryEditableTd value={e.price} onChange={(v) => void patchEntry(e.product_id, "price", v)} />
                            )}
                            <td className="px-2 py-3 text-right font-semibold tabular-nums text-primary">
                              {nairaFmt(amount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/30">
                        <td className="px-2 py-3 font-bold">Total</td>
                        <td />
                        <td />
                        <td />
                        <td />
                        <td className="px-2 py-3 text-right font-bold tabular-nums">
                          {fmtInt(detail.total_units)}
                        </td>
                        <td />
                        <td className="px-2 py-3 text-right font-bold tabular-nums text-primary">
                          {nairaFmt(detail.total_revenue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      </motion.div>
    )
  }


function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00")
  return d.toLocaleDateString("en-NG", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}
