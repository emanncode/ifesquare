import { useState, type FormEvent } from "react"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Heart,
  Package,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Ardova-style petrol green — bold station green on clean white. */
const green = {
  50: "#F0F9F3",
  100: "#D9F0E2",
  200: "#A8DDBB",
  400: "#2DB85A",
  500: "#009B4D",
  600: "#00843D",
  700: "#006B32",
  800: "#005228",
} as const

const features = [
  {
    icon: BookOpen,
    title: "Daily stock ledger",
    description:
      "Replace the handwritten book. Enter receipts and closing stock — opening, sales, and amounts fill themselves in.",
  },
  {
    icon: Calculator,
    title: "Sales that calculate themselves",
    description:
      "Totals, units sold, and revenue are derived on every row. No calculator, no end-of-day arithmetic mistakes.",
  },
  {
    icon: BarChart3,
    title: "Charts that make sense",
    description:
      "Top products, revenue share, and trends — bar, pie, and line views so you see what sold and what to restock.",
  },
  {
    icon: Package,
    title: "Products & running stock",
    description:
      "Keep names, units, prices, and current stock in one place. Closing a day carries stock forward automatically.",
  },
] as const

export default function ComingSoonPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "success">("idle")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("success")
    setEmail("")
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-white text-zinc-900">
      {/* Soft green atmosphere — light, clean, station-brand energy */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 90% 55% at 50% -10%, ${green[100]}CC, transparent 55%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 100% 40%, ${green[50]}, transparent)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 45% 35% at 0% 80%, ${green[50]}, transparent)`,
          }}
        />

        <div
          className="absolute -left-20 top-1/4 size-72 animate-float rounded-full blur-3xl"
          style={{ backgroundColor: `${green[200]}55` }}
        />
        <div
          className="absolute -right-16 top-1/3 size-80 animate-float-delayed rounded-full blur-3xl"
          style={{ backgroundColor: `${green[100]}99` }}
        />
        <div
          className="absolute bottom-0 left-1/3 size-64 animate-float-slow rounded-full blur-3xl"
          style={{ backgroundColor: `${green[200]}40` }}
        />

        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${green[200]}40 1px, transparent 1px),
              linear-gradient(to bottom, ${green[200]}40 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 70% 55% at 50% 30%, black, transparent)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span
              className="text-sm font-semibold tracking-tight"
              style={{ color: green[800] }}
            >
              Ifesquare
            </span>
          </div>
          <div
            className="flex items-center gap-2 text-xs font-medium"
            style={{ color: green[600] }}
          >
            <Heart className="size-3.5" style={{ color: green[500] }} />
            <span className="hidden sm:inline">Built for Mum&apos;s shop</span>
            <span className="sm:hidden">For Mum&apos;s shop</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center px-6 pb-16 pt-4 sm:px-10">
          <div className="animate-fade-up mx-auto w-full max-w-3xl text-center">
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm"
              style={{
                borderColor: green[200],
                backgroundColor: `${green[50]}CC`,
                color: green[700],
              }}
            >
              <Sparkles className="size-3.5" style={{ color: green[500] }} />
              Shop ledger &amp; sales analytics
            </div>

            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-[3.25rem] md:leading-[1.1]">
              <span style={{ color: green[800] }}>
                Your stock book,
                <br className="hidden sm:block" /> finally on a screen
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg">
              Ifesquare is a personal tool for a real shop — replacing the
              handwritten ledger with a simple web dashboard. Log receipts and
              closing stock each day; sales and revenue calculate themselves,
              with clear charts of what sold.
            </p>

            <div className="mx-auto mt-10 w-full max-w-md">
              {status === "success" ? (
                <div
                  className="animate-fade-up rounded-2xl border px-6 py-4 text-sm"
                  style={{
                    borderColor: green[200],
                    backgroundColor: green[50],
                    color: green[700],
                  }}
                  role="status"
                >
                  You&apos;re on the list. We&apos;ll let you know when the
                  ledger opens.
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="group relative flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <div className="relative flex-1">
                    <div
                      className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur transition-opacity duration-300 group-focus-within:opacity-100"
                      style={{
                        background: `linear-gradient(90deg, ${green[400]}, ${green[600]})`,
                      }}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      aria-label="Email address"
                      className={cn(
                        "relative w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900",
                        "placeholder:text-zinc-400 outline-none shadow-sm",
                        "transition-colors focus:border-transparent"
                      )}
                      style={{ borderColor: green[200] }}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 shrink-0 rounded-2xl px-5 text-sm font-medium text-white shadow-sm hover:opacity-95"
                    style={{ backgroundColor: green[600] }}
                  >
                    Notify me
                    <ArrowRight
                      data-icon="inline-end"
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </Button>
                </form>
              )}
              <p className="mt-3 text-xs text-zinc-400">
                One shop. One login. Built with care for family business.
              </p>
            </div>
          </div>

          {/* Mini dashboard preview */}
          <div
            className="animate-fade-up mx-auto mt-14 w-full max-w-2xl"
            style={{ animationDelay: "100ms" }}
          >
            <div
              className="rounded-2xl border bg-white p-1 shadow-xl shadow-green-900/5"
              style={{ borderColor: green[100] }}
            >
              <div
                className="overflow-hidden rounded-xl border bg-white"
                style={{ borderColor: green[100] }}
              >
                <div
                  className="flex items-center gap-2 border-b px-4 py-3"
                  style={{
                    borderColor: green[100],
                    backgroundColor: green[50],
                  }}
                >
                  <div className="flex gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: green[400] }}
                    />
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: green[200] }}
                    />
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: green[100] }}
                    />
                  </div>
                  <span
                    className="ml-2 text-[11px] font-medium tracking-wide"
                    style={{ color: green[700] }}
                  >
                    Today&apos;s ledger
                  </span>
                </div>

                <div
                  className="grid grid-cols-3 gap-2 border-b p-3 sm:gap-3 sm:p-4"
                  style={{ borderColor: green[100] }}
                >
                  {[
                    { label: "Revenue", value: "₦48,200", hint: "today" },
                    { label: "Units sold", value: "126", hint: "all products" },
                    { label: "Products", value: "12", hint: "in stock" },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="rounded-xl border px-2.5 py-3 sm:px-3 sm:py-3.5"
                      style={{
                        borderColor: green[100],
                        backgroundColor: green[50],
                      }}
                    >
                      <p
                        className="text-[10px] font-medium uppercase tracking-wider sm:text-[11px]"
                        style={{ color: green[600] }}
                      >
                        {card.label}
                      </p>
                      <p
                        className="mt-1 text-sm font-semibold tracking-tight sm:text-lg"
                        style={{ color: green[800] }}
                      >
                        {card.value}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-400 sm:text-xs">
                        {card.hint}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto p-3 sm:p-4">
                  <table className="w-full min-w-105 text-left text-[11px] sm:text-xs">
                    <thead>
                      <tr style={{ color: green[600] }}>
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium">Open</th>
                        <th className="pb-2 font-medium">In</th>
                        <th className="pb-2 font-medium">Close</th>
                        <th className="pb-2 font-medium text-right">Sales</th>
                        <th className="pb-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-700">
                      {[
                        ["Rice (25kg)", "8", "4", "5", "7", "₦28,000"],
                        ["Palm oil (L)", "20", "12", "18", "14", "₦12,600"],
                        ["Beans (kg)", "15", "0", "10", "5", "₦7,600"],
                      ].map((row) => (
                        <tr
                          key={row[0]}
                          className="border-t"
                          style={{ borderColor: green[50] }}
                        >
                          <td
                            className="py-2 pr-2 font-medium"
                            style={{ color: green[800] }}
                          >
                            {row[0]}
                          </td>
                          <td className="py-2 text-zinc-500">{row[1]}</td>
                          <td className="py-2 text-zinc-500">{row[2]}</td>
                          <td className="py-2 text-zinc-500">{row[3]}</td>
                          <td
                            className="py-2 text-right font-medium"
                            style={{ color: green[600] }}
                          >
                            {row[4]}
                          </td>
                          <td
                            className="py-2 text-right font-semibold"
                            style={{ color: green[800] }}
                          >
                            {row[5]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-center text-[10px] text-zinc-400 sm:text-[11px]">
                    Opening + receipts − closing = sales · sales × price =
                    amount
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature grid */}
          <div className="mx-auto mt-16 grid w-full max-w-3xl gap-3 sm:grid-cols-2 sm:gap-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="animate-fade-up rounded-2xl border bg-white/80 p-5 text-left shadow-sm backdrop-blur-sm"
                style={{
                  borderColor: green[100],
                  animationDelay: `${150 + i * 60}ms`,
                }}
              >
                <div
                  className="mb-3 flex size-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: green[100],
                    backgroundColor: green[50],
                  }}
                >
                  <feature.icon
                    className="size-4"
                    style={{ color: green[600] }}
                  />
                </div>
                <h2
                  className="text-sm font-semibold tracking-tight"
                  style={{ color: green[800] }}
                >
                  {feature.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div
            className="animate-fade-up mx-auto mt-16 w-full max-w-2xl"
            style={{ animationDelay: "400ms" }}
          >
            <p
              className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em]"
              style={{ color: green[600] }}
            >
              How a day works
            </p>
            <ol className="grid gap-3 sm:grid-cols-3">
              {[
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
              ].map((item) => (
                <li
                  key={item.step}
                  className="rounded-2xl border bg-white/80 px-4 py-4 text-left shadow-sm"
                  style={{ borderColor: green[100] }}
                >
                  <span
                    className="text-[11px] font-semibold tracking-widest"
                    style={{ color: green[500] }}
                  >
                    {item.step}
                  </span>
                  <h3
                    className="mt-2 text-sm font-semibold"
                    style={{ color: green[800] }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </main>

        <footer
          className="border-t px-6 py-6 text-center sm:px-10"
          style={{ borderColor: green[100] }}
        >
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} Ifesquare · Built for Mum&apos;s shop
            · Ledger &amp; sales analytics
          </p>
        </footer>
      </div>
    </div>
  )
}

function BrandMark() {
  return (
    <div className="relative flex size-9 items-center justify-center">
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `linear-gradient(145deg, ${green[400]}, ${green[700]})`,
        }}
      />
      <div className="relative flex size-7 items-center justify-center rounded-lg bg-white/95">
        <span
          className="text-xs font-bold tracking-tight"
          style={{ color: green[700] }}
        >
          IS
        </span>
      </div>
    </div>
  )
}
