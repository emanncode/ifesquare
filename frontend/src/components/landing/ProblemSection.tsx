import { motion } from "framer-motion"
import { Calculator, Clock, X } from "lucide-react"
import { FadeUp } from "@/components/landing/FadeUp"

const problems = [
  {
    icon: Calculator,
    title: "Manual arithmetic",
    description:
      "Opening + receipts − closing = sales. Every day. Every product. One mistake throws everything off.",
  },
  {
    icon: Clock,
    title: "End-of-day rush",
    description:
      "Customers waiting, phone ringing, and you're still trying to calculate sales from a notebook before the market closes.",
  },
  {
    icon: X,
    title: "Lost records",
    description:
      "A spilled drink, a torn page, a misplaced notebook. Months of data gone. No backup, no recovery.",
  },
] as const

export function ProblemSection() {
  return (
    <FadeUp delay={0.1}>
      <div className="mt-24 w-full px-[5%] sm:px-[15%]">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
          The paper problem
        </p>
        <h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          A notebook and pen worked — until it didn't
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every shopkeeper knows the feeling. End of day, tired, trying to
          add up sales while customers are still around. One distraction
          and the numbers don't balance.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {problems.map((p) => (
            <motion.div
              key={p.title}
              className="group cursor-default rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-border bg-destructive/10">
                <p.icon className="size-5 text-destructive" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </FadeUp>
  )
}
