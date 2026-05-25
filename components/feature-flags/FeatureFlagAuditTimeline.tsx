type Event = {
  id: string;
  eventType: string;
  createdAt: Date | string;
  actorUserId: string | null;
};

export function FeatureFlagAuditTimeline({ events }: { events: Event[] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No changes recorded yet.</p>;
  }

  return (
    <ol className="space-y-3" aria-label="Feature flag change history">
      {events.map((e) => (
        <li key={e.id} className="rounded-lg border border-border p-3 text-sm">
          <span className="font-medium">{e.eventType}</span>
          <time className="ml-2 text-muted-foreground" dateTime={new Date(e.createdAt).toISOString()}>
            {new Date(e.createdAt).toLocaleString("en-AU")}
          </time>
        </li>
      ))}
    </ol>
  );
}
