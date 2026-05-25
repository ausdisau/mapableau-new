import { ParticipantJourneyTimeline } from "@/components/timeline/ParticipantJourneyTimeline";
import { TimelineFilters } from "@/components/timeline/TimelineFilters";
import { TimelinePrivacyNotice } from "@/components/timeline/TimelinePrivacyNotice";
import { requireAuth } from "@/lib/auth/guards";
import { listParticipantTimeline } from "@/lib/timeline/timeline-service";

export default async function ParticipantTimelinePage() {
  const user = await requireAuth();
  let events: Awaited<ReturnType<typeof listParticipantTimeline>> = [];
  try {
    events = await listParticipantTimeline(user.id, user);
  } catch {
    events = [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Your journey</h1>
      <TimelinePrivacyNotice />
      <TimelineFilters />
      <ParticipantJourneyTimeline events={events} />
    </div>
  );
}
