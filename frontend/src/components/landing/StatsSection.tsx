import { FadeUp } from "@/components/landing/FadeUp"

const stats = [
  { value: "2 min", label: "to close a day", body: "Enter closing stock, lock the day, and you're done — faster than brewing tea." },
  { value: "Zero", label: "manual calculations", body: "Sales = opening + receipts − closing. The math happens the moment you type." },
  { value: "₦1M+", label: "tracked daily", body: "Revenue, units, and margins — see it all without touching a calculator." },
] as const

export function StatsSection() {
  return (
    <FadeUp delay={0.1}>
      <div className="mt-14 grid w-full grid-cols-3 gap-4 px-[5%] lg:gap-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card/60 px-4 py-6 text-center backdrop-blur-sm sm:px-6 sm:py-8"
          >
            <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {s.value}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">
              {s.label}
            </p>
            <p className="mx-auto mt-3 max-w-48 text-pretty text-xs leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </FadeUp>
  )
}
