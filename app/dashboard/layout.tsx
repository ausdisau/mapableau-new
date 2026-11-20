import { DashboardAppShell } from "@/components/layout/DashboardAppShell";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { requireAuth } from "@/lib/auth/guards";
import { mapableIdConfig } from "@/lib/config/mapable-id";
import { isParticipantMatchingPreviewEnabled } from "@/lib/matching/participant-preview-config";
import { isMyDayResilienceEnabled } from "@/lib/my-day-resilience/flags";
import type { UserRole } from "@/types/mapable";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const showCareOsNav = getMapAbleIntelligenceConfig().enabled;
  const showMapAbleIdNav = mapableIdConfig.dashboardEnabled;

  return (
    <DashboardAppShell
      userName={user.name}
      role={user.primaryRole as UserRole}
      showCareOsNav={showCareOsNav}
      showMapAbleIdNav={showMapAbleIdNav}
      showMyDayResilienceNav={isMyDayResilienceEnabled()}
      showMatchingPreviewNav={isParticipantMatchingPreviewEnabled()}
    >
      {children}
    </DashboardAppShell>
  );
}
