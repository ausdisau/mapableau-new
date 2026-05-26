import Image from "next/image";
import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { MAPABLE_LOGO_MARK_SRC, MAPABLE_LOGO_SRC } from "@/lib/brand/constants";

export type MapAbleLogoVariant = "full" | "mark" | "text";

export function MapAbleLogo({
  href = "/",
  title = "MapAble",
  subtitle,
  className,
  variant = "text",
  ariaLabel = "MapAble home",
}: {
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  /** full = brand image with wordmark; mark = icon only; text = mark + optional title */
  variant?: MapAbleLogoVariant;
  /** Accessible name for the logo link */
  ariaLabel?: string;
}) {
  const linkClass = cn(
    "inline-flex min-w-0 shrink-0 bg-transparent outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
    variant === "full" ? "items-center" : "items-center gap-3",
    className,
  );

  if (variant === "full") {
    return (
      <Link href={href} className={linkClass} aria-label={ariaLabel}>
        <Image
          src={MAPABLE_LOGO_SRC}
          alt=""
          width={280}
          height={140}
          className="h-[4rem] w-auto max-w-[min(270px,58vw)] bg-transparent object-contain object-left sm:h-[4.5rem]"
          priority
          unoptimized
          aria-hidden
        />
      </Link>
    );
  }

  return (
    <Link href={href} className={linkClass} aria-label={ariaLabel}>
      <Image
        src={MAPABLE_LOGO_MARK_SRC}
        alt=""
        width={48}
        height={52}
        className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
        aria-hidden
      />
      {variant === "text" ? (
        <span className="mapable-display min-w-0 truncate text-2xl font-black tracking-[-0.06em] text-primary sm:text-3xl">
          {title}
          {subtitle ? (
            <span className="mapable-soft mt-0.5 hidden truncate text-xs font-black tracking-wide text-[hsl(var(--mapable-yellow))] sm:block">
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
