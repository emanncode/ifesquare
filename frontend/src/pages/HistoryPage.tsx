import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Menu, Loader2 } from "lucide-react"
import { useAppShell } from "@/components/layout/appShell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/Card"
import { CardTitle } from "@/components/ui/CardTitle"
import { Dialog } from "@/components/ui/Dialog"
import { DialogContent } from "@/components/ui/DialogContent"
import { DayDetailPanel } from "@/components/dashboard/DayDetailPanel"
import { fmtInt, formatDate, nairaFmt, parseCommaInt } from "@/components/dashboard/format"
import { useHistory } from "@/hooks/useHistory"
import { api } from "@/lib/api"
import type { ApiHistoryDayDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

function useBelow(mq: string) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && !window.matchMedia(mq).matches)
  useEffect(() => {
    const mql = window.matchMedia(mq)
    const handler = () => setMatch(!mql.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [mq])
  return match
}

export default function HistoryPage() {
  const { openMobileNav } = useAppShell()
  const { days, loading, error, getDay } = useHistory()
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<ApiHistoryDayDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)
  const isBelowLg = useBelow("(min-width: 1024px)")

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
        <div className="flex-1">
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

          <DayDetailPanel
            selected={selected}
            detail={detail}
            detailLoading={detailLoading}
            detailError={detailError}
            today={today}
            patchEntry={patchEntry}
            onClose={() => { setSelected(null); setDetail(null) }}
            className="hidden lg:block"
          />
          {isBelowLg && (
            <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setDetail(null) } }}>
              <DialogContent showCloseButton={false} className="max-h-[90svh] flex flex-col gap-0 p-0 pt-0">
                <DayDetailPanel
                  selected={selected}
                  detail={detail}
                  detailLoading={detailLoading}
                  detailError={detailError}
                  today={today}
                  patchEntry={patchEntry}
                  onClose={() => { setSelected(null); setDetail(null) }}
                  dialog
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
      </motion.div>
    )
  }



