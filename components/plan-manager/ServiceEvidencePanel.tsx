import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function ServiceEvidencePanel({
  serviceLogs,
}: {
  serviceLogs: {
    id: string;
    bookingType: string;
    status: string;
    requestedStart: Date | string;
  }[];
}) {
  return (
    <MapAbleCard
      title="Service log evidence"
      description="Visible only when role and consent allow."
    >
      {serviceLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No linked service logs.</p>
      ) : (
        <ul className="space-y-2">
          {serviceLogs.map((log) => (
            <li key={log.id} className="rounded-lg border px-4 py-3 text-sm">
              {log.bookingType} · {log.status} ·{" "}
              {new Date(log.requestedStart).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
