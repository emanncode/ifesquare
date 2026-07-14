import { useState } from "react"
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
} from "recharts"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CHART_COLORS, tooltipNaira } from "./format"
import type { BarDatum, LineDatum, PieDatum } from "./types"

type InsightsCardProps = {
  barData: BarDatum[]
  pieData: PieDatum[]
  lineData: LineDatum[]
}

export function InsightsCard({ barData, pieData, lineData }: InsightsCardProps) {
  const [tab, setTab] = useState<"bar" | "pie" | "line">("bar")

  return (
    <Card hoverable={false} className="py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <CardTitle className="text-base">Insights</CardTitle>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="bar" className="gap-1.5">
              <BarChart3 className="size-3.5" /> Top products
            </TabsTrigger>
            <TabsTrigger value="pie" className="gap-1.5">
              <PieIcon className="size-3.5" /> Revenue share
            </TabsTrigger>
            <TabsTrigger value="line" className="gap-1.5">
              <TrendingUp className="size-3.5" /> Trend
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <CardContent className="px-5 py-5">
        <div className="h-70">
          <ResponsiveContainer>
            {tab === "bar" ? (
              barData.length ? (
                <BarChart
                  data={barData}
                  margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.9 0.02 150)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={tooltipNaira} />
                  <Bar
                    dataKey="Amount"
                    fill="oklch(0.55 0.15 150)"
                    radius={[4, 4, 0, 0]}
                  />
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
                    outerRadius={100}
                    innerRadius={56}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
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
                margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.9 0.02 150)"
                  vertical={false}
                />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={tooltipNaira} />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="oklch(0.55 0.15 150)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}
