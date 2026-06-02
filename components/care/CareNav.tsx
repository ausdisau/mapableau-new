"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";
import { mapableHeaderClass, mapablePageContainerClass } from "@/lib/brand/styles";

const NAV_ITEMS = [
  { href: "/care", label: "Overview", exact: true },
  { href: "/care/request", label: "Request support" },
  { href: "/care/bookings", label: "Bookings" },
  { href: "/care/service-logs", label: "Service logs" },
  { href: "/care/shifts", label: "Shifts" },
  { href: "/care/find", label: "Find providers" },
] as const;

export function CareNav() {
  const pathname = usePathname();

  return (
    <header className={mapableHeaderClass}>
      <div
        className={cn(
          mapablePageContainerClass,
          "flex max-w-6xl flex-wrap items-center gap-3 py-3"
        )}
      >
        <Link
          href="/care"
          className="font-heading text-lg font-bold text-foreground"
        >
          MapAble Care
        </Link>
        <nav
          className="flex flex-1 flex-wrap items-center gap-1"
          aria-label="Care navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}
