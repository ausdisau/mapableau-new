import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function HomeModificationProviderDirectory({
  providers,
}: {
  providers: {
    id: string;
    displayName: string;
    specialisations: string[];
    regions: string[];
    verificationStatus: string;
  }[];
}) {
  return (
    <MapAbleCard title="Home modification providers">
      {providers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No providers listed.</p>
      ) : (
        <ul className="space-y-3">
          {providers.map((p) => (
            <li key={p.id} className="rounded-xl border p-4">
              <h3 className="font-medium">{p.displayName}</h3>
              <p className="text-sm text-muted-foreground">
                Verification: {p.verificationStatus}
              </p>
              <p className="text-sm">Regions: {p.regions.join(", ") || "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </MapAbleCard>
  );
}
