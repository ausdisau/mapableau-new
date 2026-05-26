import { SkipToContent } from "@/components/core/SkipToContent";
import { AdminNav } from "@/components/layout/AdminNav";
import { requireAdmin } from "@/lib/auth/guards";
import { MODULE_MAIN_CLASS } from "@/lib/platform/constants";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
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
