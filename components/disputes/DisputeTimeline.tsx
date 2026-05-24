export function DisputeTimeline({
  events,
}: {
  events: {
    id: string;
    eventType: string;
    body: string;
    createdAt: string | Date;
    visibility?: string;
  }[];
}) {
  return (
    <section aria-labelledby="dispute-timeline-heading" className="space-y-3">
      <h2 id="dispute-timeline-heading" className="font-heading text-lg font-semibold">
        Timeline
      </h2>
      <ol className="space-y-3">
        {events.map((ev) => (
          <li
            key={ev.id}
            className="rounded-lg border border-border p-4"
          >
            <p className="text-xs text-muted-foreground">
              {new Date(ev.createdAt).toLocaleString("en-AU")} ·{" "}
              {ev.eventType.replace(/_/g, " ")}
            </p>
            <p className="mt-2 text-sm">{ev.body}</p>
          </li>
        ))}
      </ol>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      ) : null}
    </section>
  );
}
