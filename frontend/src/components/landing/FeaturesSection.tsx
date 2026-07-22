import { motion } from "framer-motion"
import {
  BookOpen,
  BarChart3,
  Bell,
  Calculator,
  Clock,
  TrendingUp,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react"
import { FadeUp } from "@/components/landing/FadeUp"

const features = [
  {
    icon: BookOpen,
    title: "Daily stock ledger",
    description:
      "Enter receipts and closing stock — opening, sales, and amounts fill themselves in. No calculator, no end-of-day arithmetic.",
  },
  {
    icon: BarChart3,
    title: "Charts that make sense",
    description:
      "Top products, revenue share, and trends — bar, pie, and line views so you see what sold and what's worth restocking.",
  },
  {
    icon: Bell,
    title: "Low-stock alerts",
    description:
      "Set an alert threshold per product. The dashboard flags what's running low before it becomes a problem.",
  },
  {
    icon: Calculator,
    title: "Auto-calculations",
    description:
      "Sales = opening + receipts − closing. Amount = sales × price. The math happens the moment you type closing stock.",
  },
  {
    icon: Clock,
    title: "Day close & history",
    description:
      "Lock each day when you're done. Yesterday's closing stock becomes today's opening. Every day stays searchable.",
  },
  {
    icon: TrendingUp,
    title: "Revenue breakdown",
    description:
      "See which products bring in the most money. Sort by volume, value, or margin — know what to push and what to phase out.",
  },
  {
    icon: ShieldCheck,
    title: "One shop, one login",
    description:
      "No multi-store clutter. No permissions to configure. Just you, your stock, and your numbers — clean and private.",
  },
  {
    icon: ClipboardCheck,
    title: "Export & print",
    description:
      "Pull any day or month as a clean report. Print for your records or share with anyone who needs to see the numbers.",
  },
] as const

export function FeaturesSection() {
  return (
    <div className="mt-24 w-full">
      <FadeUp>
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Everything you need
        </p>
        <h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Built around your day
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Not a generic POS. Not an accounting suite. Just the tools a
          real shop needs, every single day.
        </p>
      </FadeUp>

      <div className="mt-8 grid w-full gap-4 px-[5%] sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {features.map((feature, i) => (
          <FadeUp key={feature.title} delay={0.03 * i}>
            <motion.div
              className="group cursor-default rounded-2xl border border-border bg-card/80 p-6 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-border bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          </FadeUp>
        ))}
      </div>
    </div>
  )
}
