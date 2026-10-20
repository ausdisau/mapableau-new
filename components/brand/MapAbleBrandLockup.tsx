import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { MapAbleLogo as OriginalLogo } from "@/design/mapable-independence/MapAbleLogo";
import {
  MAPABLE_BRAND_TAGLINE,
  MAPABLE_LOGO_SRC,
} from "@/lib/brand/constants";

export type MapAbleBrandLockupSize = "header" | "hero";

/** Whole original artwork; never reconstruct its wordmark or tagline. */
export function MapAbleBrandLockup({
  href = "/",
  size = "header",
  className,
  ariaLabel = `MapAble home — ${MAPABLE_BRAND_TAGLINE}`,
  onClick,
}: {
  href?: string;
  size?: MapAbleBrandLockupSize;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "mapable-system ma-brand-link inline-flex min-w-0 shrink-0 items-center rounded-2xl p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
    >
      <OriginalLogo src={MAPABLE_LOGO_SRC} size={size === "hero" ? 280 : 160} priority />
    </Link>
  );
}
