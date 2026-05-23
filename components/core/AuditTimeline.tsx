import type { AuditLogEntryView } from "@/types/audit";

type Props = {
  entries: AuditLogEntryView[];
  emptyMessage?: string;
};

export function AuditTimeline({
  entries,
  emptyMessage = "No audit events recorded yet.",
}: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol className="space-y-4" aria-label="Audit timeline">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-l-2 border-border pl-4"
        >
          <p className="text-sm font-medium">{entry.summary}</p>
          <p className="text-xs text-muted-foreground">
            <time dateTime={entry.createdAt}>
              {new Date(entry.createdAt).toLocaleString("en-AU")}
            </time>
            {entry.actorRole ? ` · ${entry.actorRole.replace(/_/g, " ")}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
