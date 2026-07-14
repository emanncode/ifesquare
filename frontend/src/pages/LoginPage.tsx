import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandMark from "@/components/login/brandmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getLoginErrorMessage } from "@/lib/loginErrors";
import { cn } from "@/lib/utils";

interface LoginPageProps {
  /** Called with the submitted credentials. Throw (or reject) to show an error. */
  onSubmit: (email: string, password: string) => Promise<void>;
}

export default function LoginPage({ onSubmit }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(email.trim(), password);
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6">
      <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      {/* Single soft glow — a quieter echo of the coming-soon page's         */}
      {/* atmosphere, not a repeat of it. One light source, not three.       */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-120"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 0%, oklch(0.55 0.15 150 / 0.12), transparent 70%)",
        }}
      />

      <div className="animate-fade-up relative z-10 w-full max-w-95">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
              Ifesquare
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your shop's ledger
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm dark:shadow-none">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                aria-live="polite"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className={cn("mt-1 h-10 w-full font-medium", "group")}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          One shop. One login.
        </p>
      </div>
    </div>
  );
}
