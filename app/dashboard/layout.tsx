import { SkipToContent } from "@/components/core/SkipToContent";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { requireAuth } from "@/lib/auth/guards";
import { MODULE_MAIN_CLASS } from "@/lib/platform/constants";
import type { UserRole } from "@/types/mapable";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
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
