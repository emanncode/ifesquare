import { motion } from "framer-motion"
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CardTitle } from "@/components/ui/CardTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtInt, nairaFmt } from "./format";
import { ProductsTableTh } from "./ProductsTableTh";
import { ProductsTableTd } from "./ProductsTableTd";
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
      className="mb-8 overflow-hidden rounded-xl border border-border/80 py-0 sm:rounded-xl"
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
              className="h-9 rounded-xl pl-9"
              aria-label="Search products"
            />
          </div>
          <Button asChild variant="outline" size="lg" className="rounded-xl">
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
              <ProductsTableTh className="text-left">Product</ProductsTableTh>
              <ProductsTableTh align="right">Opening</ProductsTableTh>
              <ProductsTableTh align="right">Receipts</ProductsTableTh>
              <ProductsTableTh align="right" className="hidden lg:table-cell">
                Total
              </ProductsTableTh>
              <ProductsTableTh align="right">Closing</ProductsTableTh>
              <ProductsTableTh align="right">Sales</ProductsTableTh>
              <ProductsTableTh align="right" className="hidden sm:table-cell">
                Price
              </ProductsTableTh>
              <ProductsTableTh align="right">Amount</ProductsTableTh>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const lowStock = r.stock <= LOW_STOCK_THRESHOLD;
              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  whileHover={{ backgroundColor: "var(--primary) / 0.04" }}
                  className="border-b border-border/50 last:border-0"
                >
                  <ProductsTableTd className="text-left">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">
                        {r.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.unit}
                        {lowStock && (
                          <span className="ml-2 inline-flex items-center rounded-lg bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                            Low stock
                          </span>
                        )}
                      </span>
                    </div>
                  </ProductsTableTd>
                  <ProductsTableTd
                    align="right"
                    className={cn(
                      "tabular-nums text-muted-foreground",
                      lowStock &&
                        "font-semibold text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {fmtInt(r.stock)}
                  </ProductsTableTd>
                  <ProductsTableTd align="right" className="tabular-nums text-foreground">
                    {fmtInt(r.receipts)}
                  </ProductsTableTd>
                  <ProductsTableTd
                    align="right"
                    className="hidden tabular-nums font-medium text-foreground lg:table-cell"
                  >
                    {fmtInt(r.total)}
                  </ProductsTableTd>
                  <ProductsTableTd align="right" className="tabular-nums text-foreground">
                    {r.closing == null ? "—" : fmtInt(r.closing)}
                  </ProductsTableTd>
                  <ProductsTableTd
                    align="right"
                    className="tabular-nums font-semibold text-foreground"
                  >
                    {fmtInt(r.sales)}
                  </ProductsTableTd>
                  <ProductsTableTd
                    align="right"
                    className="hidden tabular-nums text-muted-foreground sm:table-cell"
                  >
                    {nairaFmt(r.price)}
                  </ProductsTableTd>
                  <ProductsTableTd
                    align="right"
                    className="tabular-nums text-base font-bold text-primary"
                  >
                    {nairaFmt(r.amount)}
                  </ProductsTableTd>
                </motion.tr>
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
              <ProductsTableTd className="text-left font-bold text-foreground">Day total</ProductsTableTd>
              <ProductsTableTd />
              <ProductsTableTd />
              <ProductsTableTd className="hidden lg:table-cell" />
              <ProductsTableTd />
              <ProductsTableTd />
              <ProductsTableTd className="hidden sm:table-cell" />
              <ProductsTableTd
                align="right"
                className="tabular-nums text-base font-bold text-primary"
              >
                {nairaFmt(grandTotal)}
              </ProductsTableTd>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}


