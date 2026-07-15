import { useMemo, useState } from "react"
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
} from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/hooks/useTheme"
import {
  fmtInt,
  getBrandChartColor,
  getChartColors,
  getChartGridColor,
  getChartLabelColor,
  getChartTickColor,
  nairaFmt,
  tooltipNaira,
} from "./format"
import type { BarDatum, LineDatum, PieDatum } from "./types"

type InsightsCardProps = {
  barData: BarDatum[]
  pieData: PieDatum[]
  lineData: LineDatum[]
  totalRevenue: number
  totalUnits: number
}

export function InsightsCard({
  barData,
  pieData,
  lineData,
  totalRevenue,
  totalUnits,
}: InsightsCardProps) {
  const [tab, setTab] = useState<"bar" | "pie" | "line">("bar")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Recompute paints when theme flips so Recharts picks up CSS variables.
  const chartPaint = useMemo(() => {
    return {
      brand: getBrandChartColor(),
      grid: getChartGridColor(),
      tick: getChartTickColor(),
      label: getChartLabelColor(),
      pieColors: getChartColors(isDark),
    }
  }, [isDark])

  const { brand, grid, tick, label, pieColors } = chartPaint

  const avgPrice = useMemo(() => {
    if (totalUnits <= 0) return null
    return totalRevenue / totalUnits
  }, [totalRevenue, totalUnits])

  const productCount = barData.length
  const tickStyle = { fontSize: 11, fill: tick }

  return (
    <Card
      hoverable={false}
      className="rounded-xl border border-border/80 py-0 sm:rounded-3xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <CardTitle className="text-base font-bold">Insights</CardTitle>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="rounded-2xl">
            <TabsTrigger value="bar" className="gap-1.5 rounded-xl">
              <BarChart3 className="size-3.5" /> Top products
            </TabsTrigger>
            <TabsTrigger value="pie" className="gap-1.5 rounded-xl">
              <PieIcon className="size-3.5" /> Revenue share
            </TabsTrigger>
            <TabsTrigger value="line" className="gap-1.5 rounded-xl">
              <TrendingUp className="size-3.5" /> Trend
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <CardContent className="px-5 py-6">
        <div className="h-[22rem] sm:h-[26rem]">
          <ResponsiveContainer>
            {tab === "bar" ? (
              barData.length ? (
                <BarChart
                  data={barData}
                  margin={{ left: 0, right: 16, top: 28, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={tickStyle}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis tick={tickStyle} />
                  <Tooltip formatter={tooltipNaira} />
                  <Bar dataKey="Amount" fill={brand} radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="Amount"
                      position="top"
                      formatter={(v) =>
                        typeof v === "number"
                          ? nairaFmt(v)
                          : String(v ?? "")
                      }
                      style={{
                        fill: label,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                  </Bar>
                </BarChart>
              ) : (
                <EmptyState label="No sales recorded yet today" />
              )
            ) : tab === "pie" ? (
              pieData.length ? (
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    innerRadius={58}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={pieColors[i % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipNaira} />
                </PieChart>
              ) : (
                <EmptyState label="No sales recorded yet today" />
              )
            ) : (
              <LineChart
                data={lineData}
                margin={{ left: 0, right: 16, top: 16, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={grid}
                  vertical={false}
                />
                <XAxis dataKey="date" tick={tickStyle} />
                <YAxis tick={tickStyle} />
                <Tooltip formatter={tooltipNaira} />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke={brand}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: brand }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <SummaryStat label="Total sales" value={nairaFmt(totalRevenue)} />
          <SummaryStat
            label="Average price / unit"
            value={avgPrice != null ? nairaFmt(avgPrice) : "—"}
          />
          <SummaryStat
            label="Products with sales"
            value={fmtInt(productCount)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}
