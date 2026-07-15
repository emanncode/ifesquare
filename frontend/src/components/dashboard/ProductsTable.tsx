import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtInt, nairaFmt } from "./format";
import type { LedgerRow } from "./types";

/** Opening stock at or below this is flagged as low. */
const LOW_STOCK_THRESHOLD = 8;

type ProductsTableProps = {
  /** View-only ledger rows for today's sales. */
  rows: LedgerRow[];
};

/**
 * Today's ledger product table — read-only.
 * Add / edit / remove products live on the Products page.
 */
export function ProductsTable({ rows }: ProductsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const grandTotal = rows.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <Card
      hoverable={false}
      className="mb-8 overflow-hidden rounded-xl border border-border/80 py-0 sm:rounded-3xl"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-bold">
            Today&apos;s products
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            View only — manage catalog on the Products page
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="h-9 rounded-2xl pl-9"
              aria-label="Search products"
            />
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-2xl">
            <Link to="/app/products">
              View all products
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-sm md:min-w-0">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Th className="text-left">Product</Th>
              <Th align="right">Opening</Th>
              <Th align="right">Receipts</Th>
              <Th align="right" className="hidden lg:table-cell">
                Total
              </Th>
              <Th align="right">Closing</Th>
              <Th align="right">Sales</Th>
              <Th align="right" className="hidden sm:table-cell">
                Price
              </Th>
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const lowStock = r.stock <= LOW_STOCK_THRESHOLD;
              return (
                <tr
                  key={r.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-primary/4"
                >
                  <Td className="text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">
                        {r.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.unit}
                        {lowStock && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                            Low stock
                          </span>
                        )}
                      </span>
                    </div>
                  </Td>
                  <Td
                    align="right"
                    className={cn(
                      "tabular-nums text-muted-foreground",
                      lowStock &&
                        "font-semibold text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {fmtInt(r.stock)}
                  </Td>
                  <Td align="right" className="tabular-nums text-foreground">
                    {fmtInt(r.receipts)}
                  </Td>
                  <Td
                    align="right"
                    className="hidden tabular-nums font-medium text-foreground lg:table-cell"
                  >
                    {fmtInt(r.total)}
                  </Td>
                  <Td align="right" className="tabular-nums text-foreground">
                    {r.closing == null ? "—" : fmtInt(r.closing)}
                  </Td>
                  <Td
                    align="right"
                    className="tabular-nums font-semibold text-foreground"
                  >
                    {fmtInt(r.sales)}
                  </Td>
                  <Td
                    align="right"
                    className="hidden tabular-nums text-muted-foreground sm:table-cell"
                  >
                    {nairaFmt(r.price)}
                  </Td>
                  <Td
                    align="right"
                    className="tabular-nums text-base font-bold text-primary"
                  >
                    {nairaFmt(r.amount)}
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {query
                    ? `No products match “${query}”`
                    : "No products yet — add them on the Products page."}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <Td className="text-left font-bold text-foreground">Day total</Td>
              <Td />
              <Td />
              <Td className="hidden lg:table-cell" />
              <Td />
              <Td />
              <Td className="hidden sm:table-cell" />
              <Td
                align="right"
                className="tabular-nums text-base font-bold text-primary"
              >
                {nairaFmt(grandTotal)}
              </Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

function Th({
  children,
  align = "center",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3.5 font-semibold",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3 py-3.5",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}
