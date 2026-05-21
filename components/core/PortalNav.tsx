"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

export type PortalNavLink = { href: string; label: string };

export function PortalNav({
  title,
  links,
  backHref = "/dashboard",
  backLabel = "Dashboard",
}: {
  title: string;
  links: PortalNavLink[];
  backHref?: string;
  backLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={title}
      className="border-b border-border bg-card"
    >
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/core"
              className="font-heading text-lg font-bold text-primary hover:underline"
            >
              MapAble Core
            </Link>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={pathname === link.href || pathname.startsWith(link.href + "/") ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring",
                    pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={backHref}
                className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-primary hover:underline"
              >
                {backLabel}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
