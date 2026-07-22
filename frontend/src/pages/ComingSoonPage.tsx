import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import BrandMark from "@/components/login/brandmark"
import { ThemeToggle } from "@/components/ThemeToggle"
import { HeroSection } from "@/components/landing/HeroSection"
import { StatsSection } from "@/components/landing/StatsSection"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { SolutionSection } from "@/components/landing/SolutionSection"
import { ComparisonSection } from "@/components/landing/ComparisonSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { HowItWorksSection } from "@/components/landing/HowItWorksSection"
import { AudienceSection } from "@/components/landing/AudienceSection"
import { CtaSection } from "@/components/landing/CtaSection"

export default function LandingPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% -10%, oklch(0.55 0.15 150 / 0.10), transparent 55%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col">
        <header className="flex items-center justify-between px-[5%] py-6">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Ifesquare
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild size="sm" className="h-10 rounded-full px-4">
              <Link to="/login">
                Sign in
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center px-[5%] pb-20 pt-6">
          <HeroSection />
          <StatsSection />
          <ProblemSection />
          <SolutionSection />
          <ComparisonSection />
          <FeaturesSection />
          <HowItWorksSection />
          <AudienceSection />
          <CtaSection />
        </main>

        <footer className="border-t border-border px-[5%] py-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <BrandMark sizeClassName="size-8" />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Ifesquare
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Ifesquare &middot; Built for
            Mum's shop &middot; Ledger & sales analytics
          </p>
        </footer>
      </div>
    </div>
  )
}
