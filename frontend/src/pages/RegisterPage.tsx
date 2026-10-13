import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandMark from "@/components/login/brandmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface RegisterPageProps {
  onSubmit: (email: string, password: string, storeName: string, phoneNumber: string) => Promise<void>;
}

export default function RegisterPage({ onSubmit }: RegisterPageProps) {
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!storeName.trim() || !email.trim() || !password) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(email.trim(), password, storeName.trim(), phoneNumber.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = storeName.trim() !== "" && email.trim() !== "" && password.length >= 6;

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-120"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 0%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
              Ifesquare
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your shop's digital ledger account
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-7 shadow-sm dark:shadow-none">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="storeName">Shop Name</Label>
              <Input
                id="storeName"
                type="text"
                autoFocus
                required
                disabled={loading}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Adeola Supermarket"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone Number (for SMS Day-Close Alerts)</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                disabled={loading}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 08012345678"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password (min 6 characters)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
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
              disabled={loading || !isFormValid}
              className={cn("mt-2 h-10 w-full font-medium", "group")}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
