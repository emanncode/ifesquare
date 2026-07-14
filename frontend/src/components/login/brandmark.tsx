import { cn } from "@/lib/utils";
import logo from "@/assets/ifequare.png";

type BrandMarkProps = {
  className?: string;
  /** Outer size utility classes, e.g. size-9 or size-11 */
  sizeClassName?: string;
};

/** Ifesquare logo mark — uses ifequare.png instead of the old "IS" monogram. */
export default function BrandMark({
  className,
  sizeClassName = "size-11",
}: BrandMarkProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
        sizeClassName,
        className,
      )}
    >
      <img
        src={logo}
        alt="Ifesquare"
        className="size-full object-cover"
        draggable={false}
      />
    </div>
  );
}
