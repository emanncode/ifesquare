import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Package, History, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import BrandMark from "@/components/login/brandmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

const navItems = [
  { label: "Today's ledger", icon: BookOpen, to: "/app", end: true },
  { label: "Products", icon: Package, to: "/app/products", end: false },
  { label: "History", icon: History, to: "/app/history", end: false },
] as const;

/**
 * Global app sidebar — fixed to the viewport so it never scrolls with pages.
 */
export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close the mobile drawer after navigation
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when path changes
  }, [location.pathname]);

  // Escape closes the mobile drawer
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll while the mobile drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSignOut() {
    await logout();
    onClose?.();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        id="app-sidebar"
        aria-label="Main navigation"
        className={cn(
          // Always fixed to viewport — does not scroll with main content
          "fixed inset-y-0 left-0 z-50 flex h-svh w-64 flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground px-4 py-6 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="mb-10 flex shrink-0 items-center justify-between gap-2 px-2">
          <NavLink
            to="/app"
            onClick={onClose}
            className="flex min-w-0 items-center gap-2.5"
          >
            <BrandMark sizeClassName="size-11" />
            <span className="truncate text-xl font-bold tracking-tight text-foreground">
              Ifesquare
            </span>
          </NavLink>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-xl lg:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base transition-colors",
                  isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <item.icon className="size-5 shrink-0" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 shrink-0 space-y-2 border-t border-border pt-4">
          {user?.email && (
            <p
              className="truncate px-3.5 text-xs text-muted-foreground"
              title={user.email}
            >
              {user.email}
            </p>
          )}
          <ThemeToggle
            showLabel
            className="h-auto w-full justify-start px-3.5 py-3 font-medium text-muted-foreground hover:text-foreground"
          />
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-5 shrink-0" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
