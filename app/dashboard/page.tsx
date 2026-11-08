import { MyDayWorkspace } from "@/components/dashboard/MyDayWorkspace";
import { adaptParticipantDashboard } from "@/lib/access/adaptive";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";
import { participantWorkspaceFlags } from "@/lib/config/participant-workspace";
import { loadProgrammaticMyDay } from "@/lib/dashboard/load-my-day";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";

export const metadata = { title: "My Day | MapAble" };

export default async function DashboardPage() {
  const user = await requireAuth();
  const snapshot = await loadProgrammaticMyDay(user.id);
  const presentation = adaptParticipantDashboard({ profile: null });
  const careOsEnabled = getMapAbleIntelligenceConfig().enabled;
  const aiEnabled = participantWorkspaceFlags.aiAssistedViewEnabled();

  const densityClass =
    presentation.applied &&
    presentation.policy?.informationDensity === "low"
      ? "max-w-3xl"
      : "";

  return (
    <div
      className={densityClass}
      data-adapt-runtime={presentation.applied ? "on" : "off"}
      data-adapt-variant={presentation.policy?.componentVariant ?? "default"}
      data-testid="participant-my-day-page"
    >
      <MyDayWorkspace
        snapshot={snapshot}
        aiEnabled={aiEnabled}
        careOsEnabled={careOsEnabled}
        roleLabelText={roleLabel(user.primaryRole)}
        showCareOsLink={careOsEnabled}
      />
    </div>
  );
}
