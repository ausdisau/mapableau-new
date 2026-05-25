import { ModerationDecisionPanel } from "./ModerationDecisionPanel";

export function ModerationQueue({
  items,
}: {
  items: {
    id: string;
    contentType: string;
    contentId: string;
    priority: string;
    status: string;
    autoFlags?: unknown;
  }[];
}) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border p-4">
          <p className="text-sm font-medium">
            {item.contentType} · {item.contentId}
          </p>
          <p className="text-xs text-muted-foreground">
            Priority: {item.priority} · Status: {item.status}
          </p>
          <ModerationDecisionPanel queueId={item.id} />
        </li>
      ))}
    </ul>
  );
}
