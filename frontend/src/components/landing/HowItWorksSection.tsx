import { motion } from "framer-motion"
import { Boxes, CheckCircle2, ClipboardPenLine } from "lucide-react"
import { FadeUp } from "@/components/landing/FadeUp"

const steps = [
  { step: "01", title: "Open your day", body: "Your ledger begins with opening stock carried from the last closed day.", icon: Boxes },
  { step: "02", title: "Record the movement", body: "Add received stock and enter closing counts as your day takes shape.", icon: ClipboardPenLine },
  { step: "03", title: "Close with confidence", body: "Review the calculated result, save the day, and carry stock forward cleanly.", icon: CheckCircle2 },
] as const

export function HowItWorksSection() {
  return <FadeUp delay={0.1}><section className="mt-24 w-full px-[5%] sm:px-[15%]"><p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">How a day works</p><h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">A clearer rhythm for every business day</h2><p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">Each action supports the next, from the first stock count to tomorrow&apos;s opening balance.</p><ol className="mt-8 grid gap-4 sm:grid-cols-3">{steps.map((item) => <motion.li key={item.step} className="relative cursor-default rounded-2xl border border-border bg-card/80 px-5 py-5 text-left shadow-sm transition-all duration-300 hover:shadow-md sm:px-6 sm:py-6" whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}><div className="flex items-center justify-between"><span className="text-[11px] font-semibold tracking-widest text-primary/70">{item.step}</span><div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-4" /></div></div><h3 className="mt-4 text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p></motion.li>)}</ol></section></FadeUp>
}
