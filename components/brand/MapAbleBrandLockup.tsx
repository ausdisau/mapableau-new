import Link from "next/link";

import { cn } from "@/app/lib/utils";
import {
  MAPABLE_BRAND_TAGLINE,
  MAPABLE_LOGO_MARK_SRC,
} from "@/lib/brand/constants";
import { mapableAaaFocusRingClass } from "@mapable/ui";

export type MapAbleBrandLockupSize = "header" | "hero" | "footer";

const sizeStyles: Record<
  MapAbleBrandLockupSize,
  { mark: string; wordmark: string; pill: string; stack: string }
> = {
  header: {
    stack: "gap-1",
    mark: "block h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10",
    wordmark:
      "text-lg font-black leading-none tracking-tight text-[#0C1833] sm:text-xl",
    pill: "px-2.5 py-1 text-[0.55rem] tracking-[0.08em] sm:px-3 sm:text-[0.62rem] sm:tracking-[0.1em]",
  },
  hero: {
    stack: "gap-1.5",
    mark: "block h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14",
    wordmark:
      "text-2xl font-black leading-none tracking-tight text-[#0C1833] sm:text-3xl",
    pill: "px-3 py-1 text-[0.62rem] tracking-[0.1em] sm:px-3.5 sm:text-[0.68rem] sm:tracking-[0.12em]",
  },
  footer: {
    stack: "gap-1",
    mark: "block h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10",
    wordmark:
      "text-lg font-black leading-none tracking-tight text-[#0C1833] sm:text-xl",
    pill: "px-2.5 py-1 text-[0.55rem] tracking-[0.08em] sm:px-3 sm:text-[0.62rem] sm:tracking-[0.1em]",
  },
};

function assertNever(value: never): never {
  throw new Error(`Unhandled brand lockup size: ${String(value)}`);
}

function lockupSizeStyles(size: MapAbleBrandLockupSize) {
  switch (size) {
    case "header":
    case "hero":
    case "footer":
      return sizeStyles[size];
    default:
      return assertNever(size);
  }
}

function lockupFetchPriority(size: MapAbleBrandLockupSize): "high" | "low" | "auto" {
  switch (size) {
    case "footer":
      return "auto";
    case "header":
    case "hero":
      return "high";
    default:
      return assertNever(size);
  }
}

/**
 * Mark + HTML wordmark + tagline pill (no link). Prefer HTML text over the
 * portrait PNG wordmark so headers stay legible and pass 1.4.9 images-of-text.
 */
export function MapAbleBrandMark({
  size = "header",
  align = "center",
  className,
  fetchPriority = "auto",
}: {
  size?: MapAbleBrandLockupSize;
  align?: "center" | "start";
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
}) {
  const styles = lockupSizeStyles(size);

  return (
    <span
      className={cn(
        "inline-flex min-w-0 flex-col",
        align === "start" ? "items-start" : "items-center",
        styles.stack,
        className,
      )}
    >
      <span className="inline-flex items-center gap-2">
        <img
          src={MAPABLE_LOGO_MARK_SRC}
          alt=""
          width={80}
          height={80}
          className={styles.mark}
          decoding="async"
          fetchPriority={fetchPriority}
          aria-hidden
        />
        <span className={styles.wordmark} aria-hidden>
          MapAble
        </span>
      </span>
      <span
        className={cn(
          "inline-flex w-fit max-w-full items-center justify-center rounded-full bg-[#0C1833] text-center font-black uppercase leading-none text-[#F8C51C]",
          styles.pill,
        )}
      >
        {MAPABLE_BRAND_TAGLINE}
      </span>
    </span>
  );
}

/**
 * Centered MapAble mark + HTML wordmark with a width-fitted tagline pill.
 * Dual focus ring (brand blue + yellow offset) for WCAG 2.4.13 on white headers.
 */
export function MapAbleBrandLockup({
  href = "/",
  size = "header",
  align = "center",
  className,
  ariaLabel = `MapAble home — ${MAPABLE_BRAND_TAGLINE}`,
  onClick,
}: {
  href?: string;
  size?: MapAbleBrandLockupSize;
  align?: "center" | "start";
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
        "inline-flex min-w-0 rounded-2xl p-1 transition hover:opacity-90",
        mapableAaaFocusRingClass,
        align === "start" ? "items-start" : "items-center",
        className,
      )}
    >
      <MapAbleBrandMark
        size={size}
        align={align}
        fetchPriority={lockupFetchPriority(size)}
      />
    </Link>
  );
}
