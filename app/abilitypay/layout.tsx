import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { AbilityPayNav } from "@/components/abilitypay/AbilityPayNav";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AbilityPayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePermission("abilitypay:read");

  return (
    <AuthenticatedRoleAppShell
      user={user}
      headerTitle="AbilityPay"
      logoHref="/abilitypay"
      secondaryNav={<AbilityPayNav />}
    >
      <div aria-live="polite" className="min-h-screen bg-background">
        <a
          href="#abilitypay-main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <main id="abilitypay-main">{children}</main>
      </div>
    </AuthenticatedRoleAppShell>
  );
}
