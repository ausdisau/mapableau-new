import { SkipToContent } from "@/components/core/SkipToContent";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { requireAuth } from "@/lib/auth/guards";
import type { UserRole } from "@/types/mapable";

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
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
