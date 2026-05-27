import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const allowed =
    user.primaryRole === "finance_lead" ||
    user.primaryRole === "plan_manager" ||
    hasPermission(user.primaryRole, "invoice:read:any") ||
    hasPermission(user.primaryRole, "reconciliation:manage");

  if (!allowed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
          <span className="font-heading font-semibold">Finance</span>
          <nav className="flex gap-3 text-sm">
            <Link href="/finance/reports">Reports</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
