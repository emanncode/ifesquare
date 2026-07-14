export const CHART_COLORS = [
  "oklch(0.55 0.15 150)",
  "oklch(0.45 0.1 150)",
  "oklch(0.65 0.12 150)",
  "oklch(0.75 0.08 150)",
]

export function nairaFmt(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—"
  return "₦" + Math.round(n).toLocaleString("en-NG")
}

/** Recharts Tooltip formatter — value may be undefined or a non-number. */
export function tooltipNaira(
  value: number | string | ReadonlyArray<number | string> | undefined,
): string {
  if (value == null || Array.isArray(value)) return nairaFmt(null)
  const n = typeof value === "number" ? value : Number(value)
  return nairaFmt(Number.isFinite(n) ? n : null)
}
