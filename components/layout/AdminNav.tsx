"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/consents", label: "Consents" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/audit-events", label: "Audit events" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/service-ops", label: "Service ops" },
  { href: "/admin/care", label: "Care" },
  { href: "/admin/transport", label: "Transport" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/workers", label: "Workers" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/job-applications", label: "Applications" },
  { href: "/admin/provider-capacity", label: "Capacity" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/invoices", label: "Invoices" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <Link href="/admin" className="font-heading text-lg font-bold">
            MapAble Admin
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to dashboard
          </Link>
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
                  pathname === link.href ||
                    (link.href !== "/admin" && pathname.startsWith(link.href))
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
