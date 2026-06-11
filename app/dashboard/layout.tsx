import { DashboardAppShell } from "@/components/layout/DashboardAppShell";
import { requireAuth } from "@/lib/auth/guards";
import { y1WedgeConfig } from "@/lib/config/y1-wedge";
import type { UserRole } from "@/types/mapable";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <DashboardAppShell
      userName={user.name}
      role={user.primaryRole as UserRole}
      wedgeFlags={y1WedgeConfig}
    >
      {children}
    </DashboardAppShell>
  );
}
