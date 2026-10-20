import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { MapAbleLogo as OriginalLogo } from "@/design/mapable-independence/MapAbleLogo";
import { MAPABLE_LOGO_SRC } from "@/lib/brand/constants";

export type MapAbleLogoVariant = "full" | "mark" | "text";

export function MapAbleLogo({
  href = "/",
  className,
  variant = "text",
  ariaLabel = "MapAble home",
}: {
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Legacy variants now all render the complete original artwork. */
  variant?: MapAbleLogoVariant;
  /** Accessible name for the logo link */
  ariaLabel?: string;
}) {
  const linkClass = cn(
    "mapable-system ma-brand-link inline-flex min-w-0 shrink-0 items-center outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className,
  );

  return (
    <Link href={href} className={linkClass} aria-label={ariaLabel}>
      <OriginalLogo src={MAPABLE_LOGO_SRC} size={variant === "full" ? 240 : 160} priority />
    </Link>
  );
}
