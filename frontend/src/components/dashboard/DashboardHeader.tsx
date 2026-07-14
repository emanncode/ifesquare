import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
          Today&apos;s ledger
        </h1>
      </div>
      <Button className="h-10">Close &amp; save day</Button>
    </header>
  )
}
