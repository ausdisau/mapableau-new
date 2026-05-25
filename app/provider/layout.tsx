import { PortalNav } from "@/components/core/PortalNav";
import { PROVIDER_ADMIN_NAV_LINKS } from "@/lib/core-ui/provider-admin-nav";
import { requireProviderPanel } from "@/lib/auth/panel-guards";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProviderPanel();

  return (
    <div className="min-h-screen bg-background">
      <PortalNav
        title="Provider admin"
        links={PROVIDER_ADMIN_NAV_LINKS}
        backHref="/dashboard"
        backLabel="Dashboard"
      />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
