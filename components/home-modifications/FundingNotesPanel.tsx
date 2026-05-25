import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { FUNDING_DISCLAIMER } from "@/lib/home-modifications/home-modification-service";

export function FundingNotesPanel({ notes }: { notes?: string | null }) {
  return (
    <MapAbleCard title="Funding notes">
      <p className="text-sm text-muted-foreground">{FUNDING_DISCLAIMER}</p>
      {notes ? (
        <p className="mt-3 text-sm">{notes}</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No funding notes added.</p>
      )}
    </MapAbleCard>
  );
}
