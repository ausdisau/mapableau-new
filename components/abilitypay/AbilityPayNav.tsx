"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

const NAV_ITEMS = [
  { href: "/abilitypay", label: "Home" },
  { href: "/abilitypay/plan", label: "Your plan" },
  { href: "/abilitypay/budgets", label: "Budgets" },
  { href: "/abilitypay/invoices", label: "Invoices" },
  { href: "/abilitypay/payment-methods", label: "Payment methods" },
  { href: "/abilitypay/approvals", label: "Approvals" },
  { href: "/abilitypay/providers", label: "Providers" },
  { href: "/abilitypay/reports", label: "Reports" },
  { href: "/abilitypay/reconciliation", label: "Reconciliation" },
  { href: "/abilitypay/audit", label: "Audit" },
  { href: "/abilitypay/admin", label: "Admin" },
] as const;

export function AbilityPayNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="AbilityPay" className="border-b border-border/60 bg-card">
      <ul
        role="tablist"
        className="flex flex-wrap gap-1 overflow-x-auto px-4 py-2"
      >
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/abilitypay"
              ? pathname === "/abilitypay"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} role="presentation">
              <Link
                href={item.href}
                role="tab"
                aria-selected={active}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
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
