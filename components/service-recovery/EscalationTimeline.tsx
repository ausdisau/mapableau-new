export function EscalationTimeline({
  events,
  escalations,
}: {
  events: { id: string; eventType: string; createdAt: Date }[];
  escalations: { id: string; reason: string; createdAt: Date }[];
}) {
  return (
    <section aria-labelledby="recovery-timeline-heading">
      <h2 id="recovery-timeline-heading" className="font-heading text-lg font-semibold">
        What happened
      </h2>
      <ol className="mt-3 space-y-2 text-sm">
        {events.map((e) => (
          <li key={e.id}>
            {e.eventType} — {new Date(e.createdAt).toLocaleString("en-AU")}
          </li>
        ))}
        {escalations.map((e) => (
          <li key={e.id}>
            Escalated: {e.reason}
          </li>
        ))}
      </ol>
    </section>
  );
}
