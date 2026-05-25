export function SupportTasksSummary({ tasks }: { tasks: unknown }) {
  const items = Array.isArray(tasks) ? tasks : [];
  if (!items.length) return null;
  return (
    <div className="rounded-xl border p-4">
      <h2 className="font-medium">Support tasks</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((task, index) => {
          const label =
            task && typeof task === "object" && "label" in task
              ? String(task.label)
              : String(task);
          return <li key={`${label}-${index}`}>{label}</li>;
        })}
      </ul>
    </div>
  );
}
export function SupportTasksSummary({ tasks }: { tasks: unknown }) {
  const items = Array.isArray(tasks) ? tasks : [];
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No structured tasks yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((task, index) => {
        const label =
          typeof task === "object" && task !== null && "label" in task
            ? String((task as { label?: unknown }).label)
            : `Task ${index + 1}`;
        const intensity =
          typeof task === "object" && task !== null && "intensity" in task
            ? String((task as { intensity?: unknown }).intensity)
            : "standard";
        return (
          <li key={`${label}-${index}`} className="rounded-lg border p-3 text-sm">
            <div className="font-medium">{label}</div>
            <div className="text-muted-foreground">Intensity: {intensity}</div>
          </li>
        );
      })}
    </ul>
  );
}
