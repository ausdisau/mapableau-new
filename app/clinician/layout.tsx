import { DashboardAppShell } from "@/components/layout/DashboardAppShell";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { requireAuth } from "@/lib/auth/guards";
import { isParticipantInformationVaultEnabled } from "@/lib/privacy/participant-vault/flags";
import type { UserRole } from "@/types/mapable";

export const dynamic = "force-dynamic";

export default async function ClinicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const showCareOsNav = getMapAbleIntelligenceConfig().enabled;
  const showInformationVault = isParticipantInformationVaultEnabled();

  return (
    <DashboardAppShell
      userName={user.name}
      role={user.primaryRole as UserRole}
      showCareOsNav={showCareOsNav}
      showInformationVault={showInformationVault}
    >
      {children}
    </DashboardAppShell>
  );
}
