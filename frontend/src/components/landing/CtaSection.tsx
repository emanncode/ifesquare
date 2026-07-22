import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeUp } from "@/components/landing/FadeUp"

export function CtaSection() {
  return (
    <FadeUp delay={0.1}>
      <div className="mt-24 flex w-full justify-center px-[5%]">
        <motion.div
          className="flex w-full flex-col items-center gap-5 rounded-2xl border border-border bg-gradient-to-b from-card/80 to-card/40 px-8 py-10 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-lg sm:px-12 sm:py-12"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Ready to see today's numbers?
          </h2>
          <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
            No setup, no onboarding call. Sign in and your ledger is
            waiting — just like it would be if you'd been writing in a
            book.
          </p>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full px-6 text-sm font-medium"
          >
            <Link to="/login">
              Sign in to your ledger
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </FadeUp>
  )
}
