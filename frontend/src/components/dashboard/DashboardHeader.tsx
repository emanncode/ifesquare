import { Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DashboardHeaderProps = {
  lastUpdated: Date;
  closeOpen: boolean;
  onCloseOpenChange: (open: boolean) => void;
  onConfirmClose: () => void;
  onRefresh: () => void;
  onMenuClick?: () => void;
};

export function DashboardHeader({
  lastUpdated,
  closeOpen,
  onCloseOpenChange,
  onConfirmClose,
  onRefresh,
  onMenuClick,
}: DashboardHeaderProps) {
  const dateLabel = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const updatedLabel = lastUpdated.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {onMenuClick && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mt-0.5 shrink-0 rounded-xl lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {dateLabel}
            </p>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex size-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Refresh ledger"
              title="Refresh"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Today&apos;s ledger
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Last updated {updatedLabel}
          </p>
        </div>
      </div>

      <Dialog open={closeOpen} onOpenChange={onCloseOpenChange}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="h-12 shrink-0 rounded-lg px-6 text-base font-semibold"
          >
            Close &amp; save day
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close &amp; save today&apos;s ledger?</DialogTitle>
            <DialogDescription>
              This will lock today&apos;s counts, update stock from closings,
              and mark the day as closed. You won&apos;t be able to edit these
              numbers afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => onCloseOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl font-semibold"
              onClick={() => {
                onConfirmClose();
                onCloseOpenChange(false);
              }}
            >
              Yes, close day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
