import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { LinkedParticipantCard } from "@/components/family/LinkedParticipantCard";

export function FamilyDashboard({
  participants,
}: {
  participants: {
    linkId: string;
    participantId: string;
    displayName: string;
    permissions: string[];
  }[];
}) {
  return (
    <div className="space-y-6">
      <MapAbleCard
        title="Family & nominee portal"
        description="Support assisted decision-making. The participant controls access by default."
      >
        <p className="text-sm">
          You are linked to {participants.length} participant
          {participants.length === 1 ? "" : "s"}.
        </p>
      </MapAbleCard>
      <div className="grid gap-4 md:grid-cols-2">
        {participants.map((p) => (
          <LinkedParticipantCard key={p.linkId} participant={p} />
        ))}
      </div>
    </div>
  );
}
