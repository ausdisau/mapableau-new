import Image from "next/image";
import Link from "next/link";

import { cn } from "@/app/lib/utils";
import {
  MAPABLE_LOGO_ALT,
  MAPABLE_LOGO_MARK_SRC,
  MAPABLE_LOGO_SRC,
} from "@/lib/brand/constants";

export type MapAbleLogoVariant = "full" | "mark" | "text";

export function MapAbleLogo({
  href = "/",
  title = "MapAble",
  subtitle,
  className,
  variant = "text",
}: {
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  /** full = brand image with wordmark; mark = icon only; text = mark + optional title */
  variant?: MapAbleLogoVariant;
}) {
  const linkClass = cn(
    "inline-flex min-w-0 rounded-xl outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    variant === "full" ? "items-center" : "items-center gap-3",
    className,
  );

  if (variant === "full") {
    return (
      <Link href={href} className={linkClass}>
        <Image
          src={MAPABLE_LOGO_SRC}
          alt={MAPABLE_LOGO_ALT}
          width={200}
          height={64}
          className="h-12 w-auto max-w-[min(200px,42vw)] object-contain object-left"
          priority
        />
      </Link>
    );
  }

  return (
    <Link href={href} className={linkClass}>
      <Image
        src={MAPABLE_LOGO_MARK_SRC}
        alt=""
        width={40}
        height={44}
        className="h-10 w-10 shrink-0 object-contain"
        aria-hidden
      />
      {variant === "text" ? (
        <span className="min-w-0 truncate font-heading text-lg font-bold tracking-tight text-foreground">
          {title}
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
