import { ArrowDown, ArrowUp } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { CardContent } from "@/components/ui/CardContent"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { cn } from "@/lib/utils"
import { nairaFmt } from "./format"
import type { MonthlyComparison } from "@/lib/types"

function shortDateRange(from: string, to: string) {
  const f = new Date(from + "T12:00:00")
  const t = new Date(to + "T12:00:00")
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${fmt(f)}–${fmt(t)}`
}

export function MonthComparisonCard({ data }: { data: MonthlyComparison }) {
  const caption = `${shortDateRange(data.current.from, data.current.to)} vs ${shortDateRange(data.previous.from, data.previous.to)}`
  return (
    <Card className="py-0">
      <CardContent className="grid gap-6 px-5 py-5 sm:grid-cols-2">
        <ComparisonStat
          label="Revenue this month"
          caption={caption}
          value={data.current.revenue}
          format={nairaFmt}
          deltaPct={data.revenueDeltaPct}
        />
        <ComparisonStat
          label="Units sold this month"
          caption={caption}
          value={data.current.units}
          format={(n: number) => String(Math.round(n))}
          deltaPct={data.unitsDeltaPct}
        />
      </CardContent>
    </Card>
  )
}

function ComparisonStat({ label, caption, value, format, deltaPct }: {
  label: string
  caption: string
  value: number
  format: (n: number) => string
  deltaPct: number | null
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        <AnimatedNumber value={value} format={format} />
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        {deltaPct == null ? (
          <span className="text-xs text-muted-foreground">
            New — no prior data to compare
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              deltaPct >= 0 ? "text-primary" : "text-muted-foreground",
            )}
          >
            {deltaPct >= 0 ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )}
            {Math.abs(deltaPct)}%
          </span>
        )}
        <span className="text-xs text-muted-foreground">{caption}</span>
      </div>
    </div>
  )
}
