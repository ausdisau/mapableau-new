"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { cn } from "@/app/lib/utils";
import { RoleBadge } from "@/components/ui/role-badge";
import type { UserRole } from "@/types/mapable";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/accessibility", label: "Accessibility" },
  { href: "/dashboard/consent", label: "Consent" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/care", label: "Care" },
  { href: "/dashboard/transport", label: "Transport" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/find-support", label: "Find support" },
  { href: "/dashboard/find-transport", label: "Find transport" },
  { href: "/dashboard/timesheets", label: "Timesheets" },
  { href: "/dashboard/incidents", label: "Incidents" },
  { href: "/dashboard/incidents/new", label: "Report concern" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/support", label: "Support" },
  { href: "/dashboard/voice", label: "Voice input" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/dashboard/funding", label: "Funding" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/settings/notifications", label: "Notification settings" },
];

export function DashboardNav({
  userName,
  role,
}: {
  userName: string;
  role: UserRole;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/core"
            className="font-heading text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            MapAble Core
          </Link>
          <p className="text-sm text-muted-foreground">
            Signed in as {userName}
          </p>
          <RoleBadge role={role} className="mt-1" />
        </div>
        <ul className="flex flex-wrap gap-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={
                  pathname === link.href ? "page" : undefined
                }
                className={cn(
                  "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {role === "mapable_admin" ? (
            <li>
              <Link
                href="/admin"
                className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                Admin
              </Link>
            </li>
          ) : null}
        </ul>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="min-h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
