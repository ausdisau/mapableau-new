import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantOpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  return (
    <ParticipationPageShell
      eyebrow="Opportunity detail"
      title="Opportunity access and fit"
      description={`Opportunity ${id} shows organiser-provided details, access freshness, sponsor separation, and participant-approved planning options.`}
      rows={rowsForParticipationTopic("Opportunity detail")}
    />
  );
}
