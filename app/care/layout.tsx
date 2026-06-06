import { CareNav } from "@/components/care/CareNav";
import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { requirePermission } from "@/lib/auth/guards";

export default async function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePermission("care:read:self");

  return (
    <AuthenticatedRoleAppShell user={user} headerTitle="Care" secondaryNav={<CareNav />}>
      {children}
    </AuthenticatedRoleAppShell>
  );
}
