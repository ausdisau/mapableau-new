"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import {
  mapableModuleNavLinkActiveClass,
  mapableModuleNavLinkClass,
} from "@/lib/brand/styles";

export type ModuleNavLink = {
  href: string;
  label: string;
  exact?: boolean;
  suffix?: ReactNode;
};

function isModuleNavLinkActive(
  pathname: string,
  link: ModuleNavLink,
): boolean {
  if (link.exact) {
    return pathname === link.href;
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function ModuleNav({
  links,
  className,
}: {
  links: ModuleNavLink[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {links.map((link) => {
        const active = isModuleNavLinkActive(pathname, link);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                active ? mapableModuleNavLinkActiveClass : mapableModuleNavLinkClass,
              )}
            >
              {link.label}
              {link.suffix}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
