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
          <div className="mt-5 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <a
              href="https://github.com/emanncode"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              emanncode
            </a>
            <a
              href="https://x.com/emanncode"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              emanncode
            </a>
            <a
              href="https://wa.me/2349048801668"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              09048801668
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
