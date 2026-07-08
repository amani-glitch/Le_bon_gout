import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";

/**
 * Le Bon Goût wordmark: a red "BG" monogram badge next to the "Bon Goût" name.
 * Matches the restaurant's black-and-red identity, crisp at any size.
 */
export function Logo({
  withText = true,
  className,
  to = "/",
}: {
  withText?: boolean;
  className?: string;
  to?: string;
}) {
  return (
    <Link to={to} className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-display text-base font-bold leading-none text-primary-fg ring-1 ring-primary/40"
      >
        BG
      </span>
      {withText && (
        <span className="font-display text-xl font-semibold tracking-tight">
          Bon<span className="text-primary"> Goût</span>
        </span>
      )}
    </Link>
  );
}
