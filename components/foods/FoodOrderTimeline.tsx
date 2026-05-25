export function FoodOrderTimeline({
  events,
}: {
  events: Array<{ id: string; title: string; createdAt: string | Date; eventType?: string }>;
}) {
  return (
    <ol className="space-y-3 border-l-2 border-border pl-4" aria-label="Order timeline">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[1.35rem] top-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
          <p className="font-medium">{e.title}</p>
          <time className="text-xs text-muted-foreground" dateTime={new Date(e.createdAt).toISOString()}>
            {new Date(e.createdAt).toLocaleString()}
          </time>
        </li>
      ))}
    </ol>
  );
}
