import { Link } from "react-router-dom"
import { ArrowRight, Sparkles, Wallet, Package, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeUp } from "@/components/landing/FadeUp"

function MockupCard({ icon: Icon, label, value, accent }: { icon: typeof Wallet; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3">
      <div className={`flex size-9 items-center justify-center rounded-lg ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function MockupTable() {
  const rows = [
    { name: "Rice (50kg)", sales: "32", amount: "₦16,000" },
    { name: "Beans (100kg)", sales: "18", amount: "₦13,500" },
    { name: "Garri (50kg)", sales: "12", amount: "₦9,600" },
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/80">
      <div className="border-b border-border/60 px-4 py-2.5">
        <p className="text-xs font-semibold text-foreground">Today&apos;s products</p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40 text-[10px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 text-left font-medium">Product</th>
            <th className="px-4 py-2 text-right font-medium">Sales</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border/30 last:border-0">
              <td className="px-4 py-2 font-medium text-foreground">{r.name}</td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{r.sales}</td>
              <td className="px-4 py-2 text-right tabular-nums font-semibold text-primary">{r.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function HeroSection() {
  return (
    <FadeUp>
      <div className="w-full px-[10%] text-center">
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

        <div className="mx-auto mt-12 max-w-lg space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <MockupCard icon={Wallet} label="Revenue" value="₦39,100" accent />
            <MockupCard icon={Package} label="Units sold" value="62" />
            <MockupCard icon={TrendingUp} label="Top product" value="Rice" />
          </div>
          <MockupTable />
        </div>
      </div>
    </FadeUp>
  )
}
