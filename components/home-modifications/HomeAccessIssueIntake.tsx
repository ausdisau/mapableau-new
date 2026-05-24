import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function HomeAccessIssueIntake({
  issues,
}: {
  issues: { id: string; area: string; issueType: string; severity: string; description?: string | null }[];
}) {
  return (
    <MapAbleCard title="Home access issues">
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No access issues recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => (
            <li key={issue.id} className="rounded-xl border p-4 text-sm">
              <p className="font-medium">{issue.area} — {issue.issueType}</p>
              <p className="text-muted-foreground">Severity: {issue.severity}</p>
              {issue.description ? <p className="mt-1">{issue.description}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
