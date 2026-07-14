import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  label: string
  value: string
  accent?: boolean
  small?: boolean
}

export function MetricCard({ label, value, accent, small }: MetricCardProps) {
  return (
    <Card className="py-0">
      <CardContent className="px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 truncate font-semibold tracking-tight",
            accent ? "text-primary" : "text-foreground",
            small ? "text-lg" : "text-2xl",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
