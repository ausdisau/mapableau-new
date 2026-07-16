import Link from "next/link";
import type { ReactNode } from "react";

import { requireAdminOpsAccess } from "@/lib/auth/guards";

const NAV = [
  { href: "/accessibility-ops", label: "Overview" },
  { href: "/accessibility-ops/assets", label: "Assets" },
  { href: "/accessibility-ops/rules", label: "Rules" },
  { href: "/accessibility-ops/tests", label: "Test lab" },
  { href: "/accessibility-ops/pilot", label: "Pilot" },
];

export default async function AccessibilityOpsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminOpsAccess();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-2 border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">MapAble platform</p>
        <h1 className="text-3xl font-semibold tracking-tight">AccessibilityOps</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Continuous accessibility operations in shadow mode. This is not a
          compliance certificate, universal score, or substitute for disabled-user
          testing.
        </p>
        <nav aria-label="AccessibilityOps sections" className="flex flex-wrap gap-3 pt-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-border px-3 py-1.5 text-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
