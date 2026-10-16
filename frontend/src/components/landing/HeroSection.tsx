import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, ArrowUpRight, BarChart3, Check, CircleCheck, Package, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeUp } from "@/components/landing/FadeUp"

const ledgerRows = [
  { name: "Rice", opening: "40", received: "15", sold: "32", low: false },
  { name: "Cooking oil", opening: "24", received: "8", sold: "27", low: true },
  { name: "Tea", opening: "36", received: "0", sold: "7", low: false },
] as const

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "primary" | "warning" }) {
  const toneClass = tone === "primary" ? "bg-primary/10 text-primary" : tone === "warning" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted/70"
  return <div className={`rounded-xl p-3 ${toneClass}`}><p className="text-[10px] font-medium uppercase tracking-wide opacity-75">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>
}

function LedgerPreview() {
  return (
    <motion.div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[1.65rem] border border-border bg-card p-3 text-left shadow-2xl shadow-primary/10 sm:p-5" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5"><div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Package className="size-4" /></div><div><p className="text-sm font-semibold">Today&apos;s ledger</p><p className="text-[11px] text-muted-foreground">Thursday, 14 March</p></div></div>
        <div className="flex items-center gap-2"><span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:inline-flex">Active day</span><Button size="xs" className="rounded-lg" tabIndex={-1}><Plus className="size-3" /><span className="hidden sm:inline">Add product</span></Button></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4"><Metric label="Products" value="28" /><Metric label="Units sold" value="66" /><Metric label="Sales total" value="Calculated" tone="primary" /><Metric label="Low stock" value="2 items" tone="warning" /></div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2.5 font-medium sm:px-4">Product</th><th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Opening</th><th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Received</th><th className="px-3 py-2.5 text-right font-medium sm:px-4">Sold</th><th className="px-3 py-2.5 text-right font-medium sm:px-4">Status</th></tr></thead>
          <tbody>{ledgerRows.map((row, index) => <motion.tr key={row.name} className="border-t border-border/70" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.08 }}><td className="px-3 py-3 font-medium sm:px-4">{row.name}</td><td className="hidden px-3 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">{row.opening}</td><td className="hidden px-3 py-3 text-right tabular-nums text-muted-foreground md:table-cell">{row.received}</td><td className="px-3 py-3 text-right font-semibold tabular-nums sm:px-4">{row.sold}</td><td className="px-3 py-3 text-right sm:px-4">{row.low ? <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">Low</span> : <CircleCheck className="ml-auto size-4 text-primary" aria-label="Stock healthy" />}</td></motion.tr>)}</tbody>
        </table>
      </div>
      <motion.div className="absolute -right-3 -top-4 hidden rounded-2xl border border-primary/15 bg-background/95 px-3 py-2 shadow-lg backdrop-blur md:block" animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}><div className="flex items-center gap-2 text-xs font-medium"><span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-3" /></span>Sales update automatically</div></motion.div>
    </motion.div>
  )
}

export function HeroSection() {
  return <FadeUp><div className="w-full px-1 text-center sm:px-[4%]"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium text-primary"><span className="size-1.5 rounded-full bg-primary" />Daily stock clarity for independent retailers</div><h1 className="mx-auto max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl md:text-6xl md:leading-[1.05]">Know what&apos;s in stock.<span className="block text-primary">Know what your day made.</span></h1><p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">Ifesquare turns the stock routine you already trust into a clear daily ledger. Record what arrives, enter what remains, and let the numbers stay connected.</p><div className="mt-8 flex flex-col items-center gap-4"><div className="flex flex-wrap items-center justify-center gap-3"><Button asChild size="lg" className="h-12 rounded-full px-6 text-sm font-medium"><Link to="/register">Create your store account <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-sm font-medium"><Link to="/login">Sign in</Link></Button></div><p className="text-xs text-muted-foreground">Start with your stock book. Keep the way you work.</p></div><div className="relative mx-auto mt-12 max-w-4xl"><div className="pointer-events-none absolute -inset-x-12 -inset-y-10 -z-10 rounded-[3rem] bg-primary/8 blur-3xl" /><LedgerPreview /></div><div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground"><span className="inline-flex items-center gap-1.5"><TrendingUp className="size-3.5 text-primary" />See daily movement</span><span className="inline-flex items-center gap-1.5"><BarChart3 className="size-3.5 text-primary" />Spot what needs attention</span><span className="inline-flex items-center gap-1.5"><ArrowUpRight className="size-3.5 text-primary" />Keep records connected</span></div></div></FadeUp>
}
