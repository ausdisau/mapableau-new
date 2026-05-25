export function TimelineEventCard({
  event,
}: {
  event: {
    title: string;
    summary: string | null;
    eventType: string;
    occurredAt: Date;
  };
}) {
  return (
    <article className="rounded-xl border border-border p-4">
      <h2 className="font-medium">{event.title}</h2>
      {event.summary ? (
        <p className="mt-1 text-sm text-muted-foreground">{event.summary}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        <time dateTime={new Date(event.occurredAt).toISOString()}>
          {new Date(event.occurredAt).toLocaleString("en-AU")}
        </time>
        {" · "}
        <span>{event.eventType.replace(/_/g, " ")}</span>
      </p>
    </article>
  );
}
