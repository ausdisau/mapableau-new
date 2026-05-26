"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import {
  MapAbleLogo,
  type MapAbleLogoVariant,
} from "@/components/brand/MapAbleLogo";
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
  logoSubtitle = "Empowering Independence",
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
        <div className="mx-auto grid items-center gap-3 py-3 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <MapAbleLogo
            href={logoHref}
            title={logoTitle}
            subtitle={logoSubtitle}
            variant={logoVariant}
            ariaLabel="MapAble home"
          />

          <nav
            className="hidden items-center justify-center gap-1 md:flex"
            aria-label="Primary"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href)
                    ? mapableNavLinkActiveClass
                    : mapableNavLinkClass
                }
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-2 md:flex">
            {actions ? (
              actions
            ) : externalCta ? (
              <Link
                href={externalCta.href}
                className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                target={
                  externalCta.href.startsWith("http") ? "_blank" : undefined
                }
                rel={
                  externalCta.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
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
            className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-primary shadow-sm transition hover:bg-accent hover:text-primary md:hidden"
            aria-expanded={open}
            aria-controls="mapable-mobile-nav"
            onClick={() => setOpen(!open)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
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
                    "block min-h-11 rounded-xl px-3 py-2.5 text-sm font-black",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
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
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-black"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground"
                  onClick={() => setOpen(false)}
                >
                  Get started
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="block min-h-11 rounded-xl px-3 py-2.5 text-sm font-black text-primary"
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
