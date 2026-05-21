"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Menu, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/app/lib/utils";
import { CORE_PLATFORM_LINKS } from "@/lib/core-ui/navigation";

export function CoreHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/core"
          className="flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-primary/35 bg-gradient-to-br from-card via-card to-primary/5"
            aria-hidden
          >
            <MapPin className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <span className="truncate font-heading text-lg font-bold tracking-tight text-foreground">
            MapAble
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Core</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {CORE_PLATFORM_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(isActive(pathname, link.href))}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-input bg-background p-2 md:hidden"
          aria-expanded={open}
          aria-controls="core-mobile-nav"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav
          id="core-mobile-nav"
          className="border-t border-border/60 px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {CORE_PLATFORM_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive(pathname, link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/core") return pathname === "/core";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return cn(
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  );
}
