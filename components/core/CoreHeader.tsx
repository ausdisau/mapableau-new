"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Menu, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/app/lib/utils";
import { CORE_CIVIC_LINKS, CORE_PLATFORM_LINKS } from "@/lib/core-ui/navigation";

export function CoreHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/core"
          className="flex items-center gap-2 font-heading text-lg font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-4 w-4" aria-hidden />
          </span>
          MapAble Core
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          <Link
            href="/core"
            className={navLinkClass(pathname === "/core")}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={navLinkClass(pathname.startsWith("/dashboard"))}
          >
            Dashboard
          </Link>
          <Link href="/core#civic" className={navLinkClass(false)}>
            Public hub
          </Link>
          <Link href="/login" className={navLinkClass(pathname === "/login")}>
            Sign in
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-border px-4 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {[...CORE_PLATFORM_LINKS.filter((l) => l.href !== "/admin"), ...CORE_CIVIC_LINKS].map(
              (link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block min-h-10 rounded-lg px-3 py-2 text-sm font-medium",
                      pathname === link.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function navLinkClass(active: boolean) {
  return cn(
    "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
  );
}
