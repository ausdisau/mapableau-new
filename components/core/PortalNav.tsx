"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";
import { MapAbleLogo } from "@/components/brand/MapAbleLogo";
import {
  mapableHeaderClass,
  mapableNavLinkActiveClass,
  mapableNavLinkClass,
  mapablePageContainerClass,
} from "@/lib/brand/styles";

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

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav aria-label={title} className={mapableHeaderClass}>
      <div className={mapablePageContainerClass}>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <MapAbleLogo href="/core" title="MapAble" subtitle={title} />
          <ul className="flex flex-wrap gap-2">
            {links.map((link) => (
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
            <li>
              <Link
                href={backHref}
                className={cn(mapableNavLinkClass, "text-primary font-semibold")}
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
