import { motion } from "framer-motion"
import { Calculator, Cloud, ShieldCheck, WifiOff } from "lucide-react"
import { FadeUp } from "@/components/landing/FadeUp"

const items = [
  {
    icon: Calculator,
    title: "Numbers that follow the ledger",
    body: "Sales and amounts are calculated from opening, receipts, and closing counts.",
  },
  {
    icon: WifiOff,
    title: "Work through weak connections",
    body: "Updates can queue locally and sync when your connection returns.",
  },
  {
    icon: ShieldCheck,
    title: "Give staff the right view",
    body: "Staff can record current-day counts while owner-only financial data stays protected.",
  },
  {
    icon: Cloud,
    title: "Keep each day connected",
    body: "Closed days stay in history, and their closing counts can become the next opening balance.",
  },
] as const

export function SolutionSection() {
  return (
    <FadeUp delay={0.1}>
      <div className="mt-24 w-full px-[5%] sm:px-[15%]">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Built for the work behind the counter
        </p>
        <h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          The important details stay visible
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Useful daily tools, clear boundaries for staff, and records that are ready when you need to look back.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <motion.div
              key={item.title}
              className="group cursor-default rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-border bg-primary/10">
                <item.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </FadeUp>
  )
}
