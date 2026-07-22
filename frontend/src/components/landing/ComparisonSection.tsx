import { motion } from "framer-motion"
import { X, Check } from "lucide-react"
import { FadeUp } from "@/components/landing/FadeUp"

const comparisons = [
  { paper: "Hand-calculated sales", ifesquare: "Auto-calculated" },
  { paper: "Notebook & pen", ifesquare: "Phone or laptop" },
  { paper: "Easy to miscount", ifesquare: "Built-in validation" },
  { paper: "One copy, no backup", ifesquare: "Cloud-saved history" },
  { paper: "End-of-day stress", ifesquare: "Close in 2 minutes" },
  { paper: "Hard to spot trends", ifesquare: "Visual charts" },
] as const

export function ComparisonSection() {
  return (
    <FadeUp delay={0.1}>
      <div className="mt-24 w-full px-[5%]">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Paper vs Ifesquare
        </p>
        <h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Same ledger. Different hands.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          The work stays the same — record stock in, count what's left.
          But the math, the backup, and the insight are handled for you.
        </p>

        <div className="mx-auto mt-8 max-w-7xl">
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-3 gap-0 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="px-4 py-3" />
              <div className="flex items-center gap-2 px-4 py-3">
                <X className="size-3.5 text-destructive" />
                Paper ledger
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
                <Check className="size-3.5 text-primary" />
                Ifesquare
              </div>
            </div>
            {comparisons.map((row, i) => (
              <motion.div
                key={row.paper}
                className={`grid grid-cols-3 gap-0 text-sm ${
                  i < comparisons.length - 1 ? "border-b border-border" : ""
                }`}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  {row.paper}
                </div>
                <div className="flex items-center px-4 py-3 text-muted-foreground">
                  <X className="mr-2 size-3.5 text-destructive/60" />
                  <span className="text-xs">{row.paper}</span>
                </div>
                <div className="flex items-center px-4 py-3 text-foreground">
                  <Check className="mr-2 size-3.5 text-primary" />
                  <span className="text-xs font-medium">{row.ifesquare}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </FadeUp>
  )
}
