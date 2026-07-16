import { cn } from "@/lib/utils"

export function Sparkline({
  values,
  className,
}: {
  values: number[]
  className?: string
}) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 64
  const h = 28
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
        opacity={0.9}
      />
    </svg>
  )
}
