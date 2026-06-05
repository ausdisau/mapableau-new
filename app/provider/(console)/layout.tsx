import { PortalNav } from "@/components/core/PortalNav";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { PROVIDER_NAV_LINKS } from "@/lib/core-ui/provider-nav";

export const dynamic = "force-dynamic";

export default async function ProviderConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  await requirePermission("care:read:org");

  return (
    <div className="min-h-screen bg-background">
      <PortalNav
        title="Provider control panel"
        links={PROVIDER_NAV_LINKS}
        backHref="/dashboard"
        backLabel="Dashboard"
      />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
