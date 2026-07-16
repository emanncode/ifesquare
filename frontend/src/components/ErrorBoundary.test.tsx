import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "./ErrorBoundary"

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("💥")
  return <div>all good</div>
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

it("renders children when no error", () => {
  render(
    <ErrorBoundary>
      <div>hello</div>
    </ErrorBoundary>,
  )
  expect(screen.getByText("hello")).toBeInTheDocument()
})

it("renders fallback UI on error", () => {
  render(
    <ErrorBoundary>
      <Bomb shouldThrow={true} />
    </ErrorBoundary>,
  )
  expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  expect(screen.getByText("💥")).toBeInTheDocument()
  expect(screen.getByText("Reload page")).toBeInTheDocument()
})

it("renders custom fallback when provided", () => {
  render(
    <ErrorBoundary fallback={<div>custom fallback</div>}>
      <Bomb shouldThrow={true} />
    </ErrorBoundary>,
  )
  expect(screen.getByText("custom fallback")).toBeInTheDocument()
})
