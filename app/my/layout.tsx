import { MyMapAbleAppShell } from "@/components/personal-agency/MyMapAbleAppShell";
import { UnifiedParticipantShell } from "@/components/layout/UnifiedParticipantShell";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";
import type { UserRole } from "@/types/mapable";

export const dynamic = "force-dynamic";

export default async function MyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePersonalAgencyGate();

  if (personalAgencyFlags.unifiedShellEnabled) {
    return (
      <UnifiedParticipantShell
        userName={user.name}
        role={user.primaryRole as UserRole}
      >
        {children}
      </UnifiedParticipantShell>
    );
  }

  return (
    <MyMapAbleAppShell userName={user.name} role={user.primaryRole as UserRole}>
      {children}
    </MyMapAbleAppShell>
  );
}
