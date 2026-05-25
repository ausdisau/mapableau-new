export function QuoteStatusTimeline({
  events,
}: {
  events: { eventType: string; createdAt: Date }[];
}) {
  return (
    <ol className="text-sm text-muted-foreground">
      {events.map((e, i) => (
        <li key={i}>
          {e.eventType} — {new Date(e.createdAt).toLocaleString("en-AU")}
        </li>
      ))}
    </ol>
  );
}
