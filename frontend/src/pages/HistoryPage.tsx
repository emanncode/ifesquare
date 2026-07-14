import { useState } from "react"
import { Loader2, Menu } from "lucide-react"
import { useAppShell } from "@/components/layout/appShell"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import { fmtInt, nairaFmt } from "@/components/dashboard/format"
import { useHistory } from "@/hooks/useHistory"
import type { ApiHistoryDayDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * History of closed days — GET /api/history and GET /api/history/:date.
 */
export default function HistoryPage() {
  const { openMobileNav } = useAppShell()
  const { days, loading, error, getDay } = useHistory()
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<ApiHistoryDayDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

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

  return (
    <div className="mx-auto p-[5%] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-2xl lg:hidden"
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
          className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {!loading && !error && days.length === 0 && (
        <Card
          hoverable={false}
          className="flex min-h-40 items-center justify-center rounded-2xl py-8 sm:rounded-3xl"
        >
          <p className="text-sm text-muted-foreground">
            No closed days yet. Close today&apos;s ledger to see it here.
          </p>
        </Card>
      )}

      {!loading && days.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
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
                  <table className="w-full min-w-[480px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-2 py-2 text-left font-semibold">
                          Product
                        </th>
                        <th className="px-2 py-2 text-right font-semibold">
                          Sales
                        </th>
                        <th className="px-2 py-2 text-right font-semibold">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.entries.map((e) => (
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
                          <td className="px-2 py-3 text-right tabular-nums">
                            {e.sales == null ? "—" : fmtInt(e.sales)}
                          </td>
                          <td className="px-2 py-3 text-right font-semibold tabular-nums text-primary">
                            {nairaFmt(e.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/30">
                        <td className="px-2 py-3 font-bold">Total</td>
                        <td className="px-2 py-3 text-right font-bold tabular-nums">
                          {fmtInt(detail.total_units)}
                        </td>
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
    </div>
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
