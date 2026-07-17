import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/CardContent";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

type MetricCardProps = {
  label: string;
  value: string | ReactNode;
  icon: LucideIcon;
  accent?: boolean;
  /** Compact value (e.g. long product names) */
  small?: boolean;
  /** e.g. "+12% today" under the main number */
  trend?: string;
  /** Optional sparkline values 0–1 (or any relative scale) */
  sparkline?: number[];
  /** Optional click handler — makes the card clickable */
  onClick?: () => void;
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  small,
  trend,
  sparkline,
  onClick,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2 }}
      className={cn("h-full", onClick && "cursor-pointer")}
    >
      <Card className={cn("flex h-full flex-col py-0", onClick && "hover:bg-muted/20")} onClick={onClick}>
        <CardContent className="flex flex-1 flex-col px-6 py-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
              )}
            >
              <Icon className="size-8" strokeWidth={2} />
            </div>
          </div>

          <p
            className={cn(
              "mt-3 truncate font-bold tracking-tight",
              accent ? "text-primary" : "text-foreground",
              small ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl",
            )}
          >
            {value}
          </p>

          <div className="mt-auto flex items-center gap-3">
            {sparkline && sparkline.length > 1 && (
              <Sparkline values={sparkline} className="h-7 w-16 text-primary" />
            )}
            {trend && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <TrendingUp className="size-3.5" />
                {trend}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


