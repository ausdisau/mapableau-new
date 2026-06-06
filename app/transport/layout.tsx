import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { TransportNav } from "@/components/layout/TransportNav";
import { requirePermission } from "@/lib/auth/guards";

export default async function TransportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePermission("transport:read:self");

  return (
    <AuthenticatedRoleAppShell user={user} headerTitle="Transport" secondaryNav={<TransportNav />}>
      {children}
    </AuthenticatedRoleAppShell>
  );
}
