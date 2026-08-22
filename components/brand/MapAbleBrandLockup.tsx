import Link from "next/link";

import { cn } from "@/app/lib/utils";
import {
  MAPABLE_BRAND_TAGLINE,
  MAPABLE_LOGO_WORDMARK_SRC,
} from "@/lib/brand/constants";

export type MapAbleBrandLockupSize = "header" | "hero";

const sizeStyles: Record<
  MapAbleBrandLockupSize,
  { image: string; tagline: string; stack: string }
> = {
  header: {
    stack: "gap-1",
    image:
      "block h-[2.8125rem] w-auto max-h-[3.25rem] max-w-[9.5rem] shrink-0 bg-transparent object-contain object-center sm:h-[3.25rem] sm:max-w-[11.5rem]",
    tagline:
      "max-w-[11.5rem] text-center text-[0.62rem] font-semibold leading-tight tracking-[0.02em] text-mapable-tagline sm:text-[0.68rem]",
  },
  hero: {
    stack: "gap-1.5",
    image:
      "block h-14 w-auto max-h-16 max-w-[12rem] shrink-0 bg-transparent object-contain object-center sm:h-16 sm:max-w-[14rem]",
    tagline:
      "max-w-[14rem] text-center text-[0.72rem] font-semibold leading-tight tracking-[0.02em] text-mapable-tagline sm:text-sm",
  },
};

/**
 * Centered MapAble mark + wordmark with the tagline as related text, not a capsule.
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
        "inline-flex min-w-0 flex-col items-center rounded-2xl p-1 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mapable-primary",
        styles.stack,
        className,
      )}
    >
      <img
        src={MAPABLE_LOGO_WORDMARK_SRC}
        alt=""
        width={280}
        height={248}
        className={styles.image}
        decoding="async"
        fetchPriority="high"
        aria-hidden
      />
      <span className={styles.tagline}>{MAPABLE_BRAND_TAGLINE}</span>
    </Link>
  );
}
