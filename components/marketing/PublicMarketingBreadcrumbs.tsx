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
      className={cn("flex flex-wrap items-center gap-2 text-sm", className)}
    >
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            href="/"
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#005B7F] transition hover:bg-slate-100",
              mapableCareFocusRing,
            )}
          >
            <House className="h-4 w-4" aria-hidden />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {crumbs.slice(1).map((crumb, index) => {
          const isLast = index === crumbs.length - 2;
          return (
            <li
              key={`${crumb.href}-${crumb.label}`}
              className="flex items-center gap-2"
            >
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-slate-500"
                aria-hidden
              />
              {isLast ? (
                <span
                  className="inline-flex min-h-11 items-center px-2 font-bold text-[#0C1833]"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-lg px-2 font-medium text-[#005B7F] transition hover:underline",
                    mapableCareFocusRing,
                  )}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
