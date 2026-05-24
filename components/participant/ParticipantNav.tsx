"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { cn } from "@/app/lib/utils";

const LINKS = [
  { href: "/participant", label: "Home" },
  { href: "/participant/profile", label: "Profile" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/accessibility", label: "Accessibility" },
  { href: "/provider-finder", label: "Find providers" },
];

export function ParticipantNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Participant"
      className="border-b border-border/60 bg-card/90 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/participant"
            className="font-heading text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            MapAble · Participant
          </Link>
          <p className="text-sm text-muted-foreground">Signed in as {userName}</p>
        </div>
        <ul className="flex flex-wrap gap-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
