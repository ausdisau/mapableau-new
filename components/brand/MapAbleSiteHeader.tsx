"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleLogo, type MapAbleLogoVariant } from "@/components/brand/MapAbleLogo";
import {
  mapableHeaderClass,
  mapableNavLinkActiveClass,
  mapableNavLinkClass,
  mapablePageContainerClass,
} from "@/lib/brand/styles";

export type MapAbleNavItem = { href: string; label: string };

const DEFAULT_NAV: MapAbleNavItem[] = [
  { href: "/core", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/billing", label: "Billing" },
  { href: "/provider-finder", label: "Provider finder" },
];

export function MapAbleSiteHeader({
  logoHref = "/core",
  logoTitle = "MapAble",
  logoSubtitle = "Core",
  navItems = DEFAULT_NAV,
  externalCta,
  actions,
  logoVariant = "text",
}: {
  logoHref?: string;
  logoTitle?: string;
  logoSubtitle?: string;
  navItems?: MapAbleNavItem[];
  externalCta?: { href: string; label: string };
  /** Replaces default sign-in CTA on desktop (e.g. Log in + Get started). */
  actions?: ReactNode;
  /** Use `full` for the official MapAble wordmark image in the header. */
  logoVariant?: MapAbleLogoVariant;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/core") return pathname === "/core";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className={mapableHeaderClass}>
      <div className={mapablePageContainerClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-3">
          <MapAbleLogo
            href={logoHref}
            title={logoTitle}
            subtitle={logoSubtitle}
            variant={logoVariant}
          />

          <div className="hidden items-center gap-2 md:flex">
            <nav
              className="mr-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1"
              aria-label="Primary"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? mapableNavLinkActiveClass : mapableNavLinkClass}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {actions ? (
              actions
            ) : externalCta ? (
              <Link
                href={externalCta.href}
                className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
                target={externalCta.href.startsWith("http") ? "_blank" : undefined}
                rel={externalCta.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {externalCta.label}
              </Link>
            ) : (
              <Link href="/login" className={mapableNavLinkClass}>
                Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-input bg-background p-2 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground md:hidden"
            aria-expanded={open}
            aria-controls="mapable-mobile-nav"
            onClick={() => setOpen(!open)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mapable-mobile-nav"
          className="border-t border-border/60 px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {actions ? (
              <li className="flex flex-col gap-2 px-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-input px-4 text-sm font-semibold"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  onClick={() => setOpen(false)}
                >
                  Get started
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="block min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium text-primary"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
