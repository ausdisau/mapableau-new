export function GoalProgressTimeline({
  checkins,
}: {
  checkins: { id: string; narrativeUpdate: string | null; createdAt: Date }[];
}) {
  if (!checkins.length) return <p className="text-sm text-muted-foreground">No check-ins yet.</p>;
  return (
    <ol className="space-y-2 text-sm">
      {checkins.map((c) => (
        <li key={c.id} className="rounded-lg border p-3">
          <time dateTime={new Date(c.createdAt).toISOString()}>
            {new Date(c.createdAt).toLocaleDateString("en-AU")}
          </time>
          <p className="mt-1">{c.narrativeUpdate ?? "Update recorded"}</p>
        </li>
      ))}
    </ol>
  );
}
