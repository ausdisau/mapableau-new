import { TimelineEventCard } from "./TimelineEventCard";

type Event = {
  id: string;
  eventType: string;
  title: string;
  summary: string | null;
  occurredAt: Date;
};

export function ParticipantJourneyTimeline({ events }: { events: Event[] }) {
  if (!events.length) {
    return (
      <p className="text-muted-foreground">Your activity will appear here as you use MapAble.</p>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Activity timeline">
      {events.map((e) => (
        <li key={e.id}>
          <TimelineEventCard event={e} />
        </li>
      ))}
    </ol>
  );
}
