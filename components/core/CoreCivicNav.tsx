"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";
import {
  mapableNavLinkActiveClass,
  mapableNavLinkClass,
} from "@/lib/brand/styles";
import { CORE_CIVIC_LINKS } from "@/lib/core-ui/navigation";

export function CoreCivicNav({
  backHref = "/core",
  backLabel = "Core hub",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Public accountability"
      className="overflow-x-auto rounded-xl border border-border/60 bg-card/50 p-2"
    >
      <ul className="flex min-w-min flex-wrap items-center gap-1">
        <li>
          <Link
            href={backHref}
            className={cn(mapableNavLinkClass, "text-primary font-semibold")}
          >
            {backLabel}
          </Link>
        </li>
        {CORE_CIVIC_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={
                isActive(link.href) ? mapableNavLinkActiveClass : mapableNavLinkClass
              }
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
