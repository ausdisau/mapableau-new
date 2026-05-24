import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function SupportedDecisionLog({
  records,
}: {
  records: {
    id: string;
    decisionType: string;
    summary: string;
    participantConfirmed: boolean;
    createdAt: Date | string;
  }[];
}) {
  return (
    <MapAbleCard title="Supported decision-making log">
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li key={r.id} className="rounded-xl border p-4 text-sm">
              <p className="font-medium">{r.summary}</p>
              <p className="mt-1 text-muted-foreground">
                {r.decisionType.replace(/_/g, " ")} ·{" "}
                {r.participantConfirmed ? "Participant confirmed" : "Awaiting confirmation"} ·{" "}
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
