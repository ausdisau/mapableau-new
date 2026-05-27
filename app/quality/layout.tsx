import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";

export default async function QualityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const allowed =
    user.primaryRole === "quality_lead" ||
    hasPermission(user.primaryRole, "provider_quality:read");
  if (!allowed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
          <span className="font-heading font-semibold">Quality &amp; Safeguards</span>
          <nav className="flex gap-3 text-sm">
            <Link href="/quality/reports">Reports</Link>
            <Link href="/quality/audit">Audit</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
