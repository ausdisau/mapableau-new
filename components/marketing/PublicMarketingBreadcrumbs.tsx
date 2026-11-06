"use client";

import { ChevronRight, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { buildMarketingBreadcrumbs } from "@/lib/marketing/site-navigation";

export function PublicMarketingBreadcrumbs({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname() ?? "/";
  const crumbs = buildMarketingBreadcrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-1.5 text-sm", className)}
    >
      <Link
        href="/"
        className={cn(
          "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[#005B7F] transition hover:bg-slate-100",
          mapableCareFocusRing,
        )}
      >
        <House className="h-4 w-4" aria-hidden />
        <span className="sr-only">Home</span>
      </Link>
      {crumbs.slice(1).map((crumb, index) => {
        const isLast = index === crumbs.length - 2;
        return (
          <span key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            {isLast ? (
              <span
                className="font-bold text-[#0C1833]"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  "rounded-lg px-1 font-medium text-[#005B7F] transition hover:underline",
                  mapableCareFocusRing,
                )}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
