import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

type Provider = {
  id: string;
  name: string;
  verificationStatus: string;
  serviceRegions: string[];
  ndisRegistrationClaimed: boolean;
  comparisonNote?: string;
};

export function ProviderComparisonPanel({ providers }: { providers: Provider[] }) {
  return (
    <MapAbleCard
      title="Provider comparison"
      description="Compare options with the participant. MapAble does not recommend one provider over another."
    >
      {providers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No providers to compare.</p>
      ) : (
        <ul className="space-y-3">
          {providers.map((p) => (
            <li key={p.id} className="rounded-xl border p-4">
              <h3 className="font-medium">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Verification: {p.verificationStatus.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-muted-foreground">
                Regions: {p.serviceRegions.join(", ") || "Not listed"}
              </p>
              <p className="text-sm">
                NDIS registration claimed: {p.ndisRegistrationClaimed ? "Yes" : "No"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
