export function WwcTimeline({
  events,
}: {
  events: {
    id: string;
    eventType: string;
    createdAt: Date | string;
    payloadJson: unknown;
  }[];
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events recorded.</p>;
  }

  return (
    <ol className="space-y-3 border-l-2 border-border pl-4">
      {events.map((event) => (
        <li key={event.id} className="text-sm">
          <time className="text-xs text-muted-foreground">
            {new Date(event.createdAt).toLocaleString("en-AU")}
          </time>
          <p className="font-medium">{event.eventType.replace(/_/g, " ")}</p>
        </li>
      ))}
    </ol>
  );
}
