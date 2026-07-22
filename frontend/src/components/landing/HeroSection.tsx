import { Link } from "react-router-dom"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeUp } from "@/components/landing/FadeUp"

export function HeroSection() {
  return (
    <FadeUp>
      <div className="w-full px-[15%] text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-primary backdrop-blur-sm">
          <Sparkles className="size-4" />
          Shop ledger & sales analytics
        </div>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-[3.5rem] md:leading-[1.1]">
          Your stock book,
          <br className="hidden sm:block" /> finally on a screen
        </h1>

        <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Ifesquare replaces a handwritten shop ledger with a simple
          dashboard. Log receipts and closing stock each day — sales and
          revenue calculate themselves, with clear charts of what sold and
          low-stock alerts before you run out.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
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
          <p className="text-xs text-muted-foreground">
            One shop. One login. Built with care for family business.
          </p>
        </div>
      </div>
    </FadeUp>
  )
}
