import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantParticipationPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  return (
    <ParticipationPageShell
      eyebrow="Plan detail"
      title="Participation plan"
      description={`Plan ${id} keeps cancellation local to the participation plan and does not block future access or service options.`}
      rows={rowsForParticipationTopic("Plan detail")}
    />
  );
}
