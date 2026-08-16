import { useState } from "react"
import { Download, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/Card"
import { CardTitle } from "@/components/ui/CardTitle"
import { Input } from "@/components/ui/input"
import { fmtInt, formatDate, nairaFmt } from "./format"
import { HistoryEditableTd } from "./HistoryEditableTd"
import type { ApiHistoryDayDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

export function DayDetailPanel({
  selected, detail, detailLoading, detailError, today, patchEntry, onClose, dialog, className,
}: {
  selected: string | null
  detail: ApiHistoryDayDetail | null
  detailLoading: boolean
  detailError: string | null
  today: string
  patchEntry: (productId: number, field: "opening" | "receipts" | "closing" | "price", raw: string) => Promise<boolean | void>
  onClose: () => void
  dialog?: boolean
  className?: string
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const entries = detail
    ? q
      ? detail.entries.filter((e) => e.product_name.toLowerCase().includes(q))
      : detail.entries
    : []
  const units = entries.reduce(
    (sum, e) =>
      sum +
      (e.closing != null && e.closing >= 0
        ? Math.max(0, e.opening + e.receipts - e.closing)
        : 0),
    0,
  )
  const revenue = entries.reduce(
    (sum, e) =>
      sum +
      (e.closing != null && e.closing >= 0
        ? Math.max(0, e.opening + e.receipts - e.closing) * e.price
        : 0),
    0,
  )
  return (
<Card
      hoverable={false}
      className={cn(
        "overflow-hidden py-0",
        dialog
          ? "flex-1 min-h-0 flex flex-col"
          : "lg:sticky lg:top-6 lg:max-h-[calc(100svh-6rem)] lg:flex lg:flex-col lg:overflow-y-auto",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <CardTitle className="text-base">
          {selected ? formatDate(selected) : "Day detail"}
        </CardTitle>
        <div className="flex items-center gap-2">
          {selected && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg text-xs"
              onClick={() => {
                const a = document.createElement("a")
                a.href = `/api/history/${selected}/export`
                a.download = `ifesquare-${selected}.csv`
                a.click()
              }}
            >
              <Download className="size-3.5" />
              Export
            </Button>
          )}
          {dialog && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="rounded-lg"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-5">
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
          <>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="h-9 w-full rounded-xl pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
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
                {entries.map((e) => {
                  const total = e.opening + e.receipts
                  const sales = e.closing != null && e.closing >= 0 ? Math.max(0, total - e.closing) : 0
                  const amount = sales * e.price
                  const isToday = detail.date === today
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-2 py-3 font-medium text-foreground">
                        {e.product_name}
                      </td>
                      {isToday ? (
                        <>
                          <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{fmtInt(e.opening)}</td>
                          <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{fmtInt(e.receipts)}</td>
                        </>
                      ) : (
                        <>
                          <HistoryEditableTd value={e.opening} onChange={(v) => patchEntry(e.product_id, "opening", v)} />
                          <HistoryEditableTd value={e.receipts} onChange={(v) => patchEntry(e.product_id, "receipts", v)} />
                        </>
                      )}
                      <td className="px-2 py-3 text-right tabular-nums font-medium text-foreground">
                        {fmtInt(total)}
                      </td>
                      {isToday ? (
                        <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{e.closing == null ? "—" : fmtInt(e.closing)}</td>
                      ) : (
                        <HistoryEditableTd value={e.closing} onChange={(v) => patchEntry(e.product_id, "closing", v)} placeholder="—" />
                      )}
                      <td className="px-2 py-3 text-right tabular-nums font-semibold text-foreground">
                        {fmtInt(sales)}
                      </td>
                      {isToday ? (
                        <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">{nairaFmt(e.price)}</td>
                      ) : (
                        <HistoryEditableTd value={e.price} onChange={(v) => patchEntry(e.product_id, "price", v)} />
                      )}
                      <td className="px-2 py-3 text-right font-semibold tabular-nums text-primary">
                        {nairaFmt(amount)}
                      </td>
                    </tr>
                  )
                })}
                {entries.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No products match “{query.trim()}”
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td className="px-2 py-3 font-bold">Total</td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td className="px-2 py-3 text-right font-bold tabular-nums">
                    {fmtInt(units)}
                  </td>
                  <td />
                  <td className="px-2 py-3 text-right font-bold tabular-nums text-primary">
                    {nairaFmt(revenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          </>
        )}
      </div>
    </Card>
  )
}
