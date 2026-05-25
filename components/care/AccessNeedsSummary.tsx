export function AccessNeedsSummary({
  summary,
  accessNeeds = [],
}: {
  summary?: string | null;
  accessNeeds?: Array<{ id: string; category: string; description: string }>;
}) {
  if (!summary && !accessNeeds.length) return null;
  return (
    <div className="rounded-xl border p-4">
      <h2 className="font-medium">Access needs</h2>
      {summary ? <p className="mt-2 text-sm">{summary}</p> : null}
      {accessNeeds.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {accessNeeds.map((need) => (
            <li key={need.id}>
              <span className="font-medium">{need.category}:</span>{" "}
              {need.description}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
export function AccessNeedsSummary({
  summary,
  needs,
}: {
  summary?: string | null;
  needs?: Array<{ category: string; description: string; intensity: string }>;
}) {
  if (!summary && (!needs || needs.length === 0)) {
    return (
      <p className="text-sm text-muted-foreground">
        No shared access needs recorded for this care booking.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {summary ? <p className="rounded-lg border p-3 text-sm">{summary}</p> : null}
      {needs?.length ? (
        <ul className="space-y-2">
          {needs.map((need) => (
            <li key={`${need.category}-${need.description}`} className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{need.category}</div>
              <div>{need.description}</div>
              <div className="text-muted-foreground">Intensity: {need.intensity}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
