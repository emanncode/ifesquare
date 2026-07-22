import { motion } from "framer-motion"
import { Smartphone, Calculator, ShieldCheck, LineChart } from "lucide-react"
import { FadeUp } from "@/components/landing/FadeUp"

const items = [
  {
    icon: Smartphone,
    title: "Works on any phone",
    body: "No app to install. Open the browser on your phone, sign in, and the dashboard is ready.",
  },
  {
    icon: Calculator,
    title: "No math required",
    body: "Type closing stock. Sales, revenue, and amounts calculate themselves. Every time.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "One login, one shop. No shared accounts, no accidental changes from someone else.",
  },
  {
    icon: LineChart,
    title: "See what matters",
    body: "Charts show top products, revenue trends, and what to restock — at a glance.",
  },
] as const

export function SolutionSection() {
  return (
    <FadeUp delay={0.1}>
      <div className="mt-24 w-full px-[5%] sm:px-[15%]">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
          How it helps
        </p>
        <h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          The ledger you'd build if you had time to build one
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Ifesquare was built for one shop — Mum's shop. Every feature
          exists because the ledger actually needed it. Nothing more,
          nothing less.
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
