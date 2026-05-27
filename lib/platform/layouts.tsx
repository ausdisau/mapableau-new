import { AdminNav } from "@/components/layout/AdminNav";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { CoreShell } from "@/components/core/CoreShell";
import { SkipToContent } from "@/components/core/SkipToContent";
import { requireAdmin, requireAuth } from "@/lib/auth/guards";
import { MODULE_MAIN_CLASS } from "@/lib/platform/constants";
import type { UserRole } from "@/types/mapable";

/** Standard layout for civic / account surfaces that use CoreShell. */
export async function CoreModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}

/** Participant dashboard shell — auth required. */
export async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <DashboardNav userName={user.name} role={user.primaryRole as UserRole} />
      <main id="main-content" className={MODULE_MAIN_CLASS}>
        {children}
      </main>
    </div>
  );
}

/** Platform admin shell — admin role required. */
export async function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <AdminNav />
      <main id="main-content" className={MODULE_MAIN_CLASS}>
        {children}
      </main>
    </div>
  );
}
