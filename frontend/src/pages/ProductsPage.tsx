import { Menu } from "lucide-react"
import { useAppShell } from "@/components/layout/appShell"
import { ProductsCatalog } from "@/components/dashboard/ProductsCatalog"
import { Button } from "@/components/ui/button"

/**
 * Products management — inline table CRUD (add, edit cells, remove).
 * Today's ledger remains view-only.
 */
export default function ProductsPage() {
  const { openMobileNav } = useAppShell()

  return (
    <div className="mx-auto p-[5%] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl lg:hidden"
          onClick={openMobileNav}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Catalog
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
            Products
          </h1>
        </div>
      </div>

      <ProductsCatalog />
    </div>
  )
}
