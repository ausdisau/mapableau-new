import { GovernmentPartnerNav } from "@/components/layout/GovernmentPartnerNav";
import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function GovernmentPartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <AuthenticatedRoleAppShell
      user={user}
      headerTitle="Government partner"
      secondaryNav={<GovernmentPartnerNav />}
    >
      {children}
    </AuthenticatedRoleAppShell>
  );
}
