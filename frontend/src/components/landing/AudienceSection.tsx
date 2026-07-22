import { motion } from "framer-motion"
import { Store, Users, Receipt } from "lucide-react"
import { FadeUp } from "@/components/landing/FadeUp"

const audience = [
  {
    icon: Store,
    title: "Small shops & kiosks",
    description:
      "One-person operations that need a simple way to track stock without accounting software.",
  },
  {
    icon: Users,
    title: "Family-run businesses",
    description:
      "Mum-and-pop stores where everyone helps out and the ledger needs to be easy for anyone to use.",
  },
  {
    icon: Receipt,
    title: "Distributors & resellers",
    description:
      "People who move inventory regularly and need to know what sold, what's left, and what to reorder.",
  },
] as const

export function AudienceSection() {
  return (
    <FadeUp delay={0.1}>
      <div className="mt-24 w-full px-[5%] sm:px-[15%]">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Who it's for
        </p>
        <h2 className="text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Built for real shops, not corporations
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Ifesquare started as a tool for one shop. It turns out most
          small shops have the same needs.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {audience.map((a) => (
            <motion.div
              key={a.title}
              className="group cursor-default rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl border border-border bg-secondary/60">
                <a.icon className="size-5 text-secondary-foreground" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {a.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {a.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </FadeUp>
  )
}
