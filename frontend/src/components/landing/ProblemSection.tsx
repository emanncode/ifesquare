import { motion } from "framer-motion"
import { ArrowRight, Calculator, FileWarning, NotebookPen } from "lucide-react"
import { FadeUp } from "@/components/landing/FadeUp"

const points = [
  { icon: NotebookPen, title: "The count lives in one place", description: "Keep the familiar opening, receipts, and closing routine without building a second record later." },
  { icon: Calculator, title: "The calculation follows the count", description: "Sales are calculated from the stock you enter, so your day can be reviewed without manual arithmetic." },
  { icon: FileWarning, title: "The record is ready when you need it", description: "Closed days remain available to review, correct where permitted, and export for your own records." },
] as const

export function ProblemSection() {
  return <FadeUp delay={0.1}><section className="mt-24 w-full px-[5%] sm:px-[15%]"><p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">Familiar, made clearer</p><h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">Keep the routine. Lose the loose ends.</h2><p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">Ifesquare follows the logic of a daily stock book, then makes the totals, history, and next day easier to trust.</p><div className="mt-8 grid gap-4 sm:grid-cols-3">{points.map((point) => <motion.div key={point.title} className="group cursor-default rounded-2xl border border-border bg-card/80 p-6 shadow-sm transition-all duration-300 hover:shadow-md" whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}><div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><point.icon className="size-5" /></div><h3 className="text-sm font-semibold tracking-tight">{point.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.description}</p><ArrowRight className="mt-5 size-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden /></motion.div>)}</div></section></FadeUp>
}
