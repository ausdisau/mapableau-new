import Link from "next/link";

import { cn } from "@/app/lib/utils";
import {
  MAPABLE_BRAND_TAGLINE,
  MAPABLE_LOGO_WORDMARK_SRC,
} from "@/lib/brand/constants";

export type MapAbleBrandLockupSize = "header" | "hero";

const sizeStyles: Record<MapAbleBrandLockupSize, { image: string }> = {
  header: {
    image:
      "block h-16 w-auto max-h-[4.5rem] max-w-[4.5rem] shrink-0 bg-transparent object-contain object-center sm:h-[4.5rem] sm:max-h-[5rem] sm:max-w-[5rem]",
  },
  hero: {
    image:
      "block h-28 w-auto max-h-32 max-w-32 shrink-0 bg-transparent object-contain object-center sm:h-32 sm:max-h-36 sm:max-w-36",
  },
};

/**
 * Official MapAble vertical lockup (icon + wordmark + baked-in tagline).
 * The PNG includes “Empowering Independence”; do not add a duplicate HTML pill.
 */
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
  const styles = sizeStyles[size];

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "inline-flex min-w-0 items-center justify-center rounded-2xl p-1 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8C51C]",
        className,
      )}
    >
      <img
        src={MAPABLE_LOGO_WORDMARK_SRC}
        alt=""
        width={1254}
        height={1254}
        className={styles.image}
        decoding="async"
        fetchPriority="high"
        aria-hidden
      />
    </Link>
  );
}
