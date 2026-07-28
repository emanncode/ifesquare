/** Fallback palette when CSS vars aren't readable (SSR / tests). */
export const CHART_COLORS_LIGHT = [
  "oklch(0.55 0.15 150)",
  "oklch(0.45 0.1 150)",
  "oklch(0.65 0.12 150)",
  "oklch(0.75 0.08 150)",
]

export const CHART_COLORS_DARK = [
  "oklch(0.7 0.14 150)",
  "oklch(0.62 0.12 150)",
  "oklch(0.78 0.1 150)",
  "oklch(0.52 0.1 150)",
]

/** @deprecated Prefer getChartColors() for theme-aware charts. */
export const CHART_COLORS = CHART_COLORS_LIGHT

export function fmtInt(n: number | null | undefined) {
  if (n == null || Number.isNaN(n) || n === 0) return "—"
  return Math.round(n).toLocaleString("en-NG")
}

export function nairaFmt(n: number | null) {
  if (n == null || Number.isNaN(n) || n === 0) return "—"
  return "₦" + Math.round(n).toLocaleString("en-NG")
}

export function parseCommaInt(s: string): number {
	return Number(s.replace(/,/g, "")) || 0
}

/** Strips all non-digit characters (for internal use before sending to API). */
export function stripNonDigits(s: string): string {
	return s.replace(/\D/g, "")
}

/** Formats a numeric string with thousand separators as the user types. */
export function formatWithCommas(raw: string): string {
	const digits = raw.replace(/\D/g, "")
	if (!digits) return ""
	return Number(digits).toLocaleString("en-NG")
}

export function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00")
  return d.toLocaleDateString("en-NG", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/** Recharts Tooltip formatter — value may be undefined or a non-number. */
export function tooltipNaira(
  value: number | string | ReadonlyArray<number | string> | undefined,
): string {
  if (value == null || Array.isArray(value)) return nairaFmt(null)
  const n = typeof value === "number" ? value : Number(value)
  return nairaFmt(Number.isFinite(n) ? n : null)
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return v || fallback
}

/** Brand primary fill for bars/lines — tracks light/dark CSS variables. */
export function getBrandChartColor() {
  return cssVar("--primary", "oklch(0.55 0.15 150)")
}

export function getChartGridColor() {
  return cssVar("--border", "oklch(0.9 0.02 150)")
}

export function getChartTickColor() {
  return cssVar("--muted-foreground", "oklch(0.5 0.02 150)")
}

export function getChartLabelColor() {
  return cssVar("--foreground", "oklch(0.22 0.02 155)")
}

export function getChartColors(isDark: boolean) {
  const fallbacks = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT
  return [
    cssVar("--chart-1", fallbacks[0]),
    cssVar("--chart-2", fallbacks[1]),
    cssVar("--chart-3", fallbacks[2]),
    cssVar("--chart-4", fallbacks[3]),
  ]
}
