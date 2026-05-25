import Link from "next/link";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function LinkedParticipantCard({
  participant,
}: {
  participant: {
    linkId: string;
    participantId: string;
    displayName: string;
    permissions: string[];
  };
}) {
  return (
    <MapAbleCard title={participant.displayName}>
      <p className="text-sm text-muted-foreground">
        Permissions: {participant.permissions.length} granted
      </p>
      <ul className="mt-2 text-xs text-muted-foreground">
        {participant.permissions.slice(0, 4).map((s) => (
          <li key={s}>{s.replace(/_/g, " ")}</li>
        ))}
      </ul>
      <Link
        href={`/family/participants/${participant.participantId}`}
        className="mt-4 inline-flex min-h-11 items-center text-primary underline"
      >
        Open dashboard
      </Link>
    </MapAbleCard>
  );
}
