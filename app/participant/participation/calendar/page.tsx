import { ParticipationPageShell } from "@/components/participation/ParticipationPageShell";
import { rowsForParticipationTopic } from "@/components/participation/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ParticipantParticipationCalendarPage() {
  await requireAuth();
  return (
    <ParticipationPageShell
      eyebrow="Referenced calendar"
      title="Participation calendar"
      description="Participation plans reference existing calendar events by ID and do not create a duplicate calendar system."
      rows={rowsForParticipationTopic("Calendar")}
    />
  );
}
