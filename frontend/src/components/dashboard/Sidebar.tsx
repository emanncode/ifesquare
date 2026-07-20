import { useContext, useEffect } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Package, History, LogOut, X, AlertTriangle, Settings } from "lucide-react";
import { usePendingSync } from "@/hooks/usePendingSync";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import BrandMark from "@/components/login/brandmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { ProductsContext } from "@/components/dashboard/productsContext";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const productsCtx = useContext(ProductsContext)
  const lowStockCount = productsCtx ? productsCtx.rows.filter((r) => r.isLowStock).length : 0
  const pendingCount = usePendingSync()
  const isStaff = user?.role === "staff"

  const navItems = isStaff
    ? [
        { label: "Today's ledger", icon: BookOpen, to: "/app", end: true },
      ] as const
    : [
        { label: "Today's ledger", icon: BookOpen, to: "/app", end: true },
        { label: "Products", icon: Package, to: "/app/products", end: false },
        { label: "History", icon: History, to: "/app/history", end: false },
        { label: "Settings", icon: Settings, to: "/app/settings", end: false },
      ] as const;

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
            <BrandMark sizeClassName="size-11" className="rounded-xl" />
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
          <LayoutGroup>
            {navItems.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                onClick={onClose}
              >
                {({ isActive }) => (
                  <span className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-base transition-colors",
                    isActive
                      ? "font-semibold text-primary"
                      : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-xl bg-primary/10"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      <item.icon className="size-5 shrink-0" strokeWidth={2} />
                      {item.label}
                      {item.label === "Products" && lowStockCount > 0 && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
                        >
                          <AlertTriangle className="size-3" />
                          {lowStockCount}
                        </motion.span>
                      )}
                    </span>
                  </span>
                )}
              </NavLink>
            ))}
          </LayoutGroup>
        </nav>

        <div className="mt-4 shrink-0 space-y-2 border-t border-border pt-4">
          {!isStaff && user?.email && (
            <NavLink
              to="/app/settings"
              onClick={onClose}
              className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="size-3.5 shrink-0" strokeWidth={2} />
              <span className="truncate">{user.email}</span>
            </NavLink>
          )}

          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
              <span className="relative inline-flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
              </span>
              {pendingCount} change{pendingCount !== 1 ? "s" : ""} pending sync
            </div>
          )}

          <ThemeToggle
            showLabel
            className="h-auto w-full justify-start px-3.5 py-3 font-medium text-muted-foreground hover:text-foreground"
          />
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-5 shrink-0" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
