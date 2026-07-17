"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin/ops/quality-safeguards", label: "Home", exact: true },
  { href: "/admin/ops/quality-safeguards/inbox", label: "Inbox" },
  { href: "/admin/ops/quality-safeguards/incidents", label: "Incidents" },
  { href: "/admin/ops/quality-safeguards/complaints", label: "Complaints" },
  { href: "/admin/ops/quality-safeguards/safeguarding", label: "Safeguarding" },
  { href: "/admin/ops/quality-safeguards/credentials", label: "Credentials" },
  { href: "/admin/ops/quality-safeguards/training", label: "Training" },
  {
    href: "/admin/ops/quality-safeguards/service-quality",
    label: "Service quality",
  },
  { href: "/admin/ops/quality-safeguards/capa", label: "CAPA" },
  { href: "/admin/ops/quality-safeguards/risk-register", label: "Risk register" },
  { href: "/admin/ops/quality-safeguards/audits", label: "Audits" },
  { href: "/admin/ops/quality-safeguards/evidence", label: "Evidence" },
  { href: "/admin/ops/quality-safeguards/policies", label: "Policies" },
  { href: "/admin/ops/quality-safeguards/analytics", label: "Analytics" },
  { href: "/admin/ops/quality-safeguards/settings", label: "Settings" },
];

export function QsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Quality and Safeguards sections"
      className="overflow-x-auto border-b border-border pb-2"
    >
      <ul className="flex min-w-max gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  active
                    ? "inline-flex min-h-11 items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                    : "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                }
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
