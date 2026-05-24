import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function LinkedParticipantList({
  participants,
}: {
  participants: { participantId: string; displayName: string }[];
}) {
  return (
    <MapAbleCard title="Linked participants">
      {participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No linked participants. Access requires participant consent.
        </p>
      ) : (
        <ul className="space-y-2">
          {participants.map((p) => (
            <li key={p.participantId} className="rounded-lg border px-4 py-3">
              {p.displayName}
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
