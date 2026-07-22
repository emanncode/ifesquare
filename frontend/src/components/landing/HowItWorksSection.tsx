import { motion } from "framer-motion"
import { FadeUp } from "@/components/landing/FadeUp"

const steps = [
  {
    step: "01",
    title: "Record stock in",
    body: "Log receipts as goods arrive. Opening stock is already there from yesterday.",
  },
  {
    step: "02",
    title: "Enter closing",
    body: "Count what's left. Sales and revenue appear without you doing the math.",
  },
  {
    step: "03",
    title: "Close the day",
    body: "Lock numbers in. Closing stock becomes tomorrow's opening — history stays clean.",
  },
] as const

export function HowItWorksSection() {
  return (
    <FadeUp delay={0.1}>
      <div className="mt-24 w-full px-[5%] sm:px-[15%]">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
          How a day works
        </p>
        <h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Three steps, two minutes
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          You already do this with a notebook. Ifesquare just removes the
          pen, the calculator, and the worry.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((item) => (
            <motion.li
              key={item.step}
              className="group cursor-default rounded-2xl border border-border bg-card/80 px-5 py-5 text-left shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md sm:px-6 sm:py-6"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <span className="text-[11px] font-semibold tracking-widest text-primary/70">
                {item.step}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </FadeUp>
  )
}
