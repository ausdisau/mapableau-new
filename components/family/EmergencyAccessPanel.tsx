import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

export function EmergencyAccessPanel({
  hasPermission,
  profile,
}: {
  hasPermission: boolean;
  profile?: Record<string, unknown> | null;
}) {
  if (!hasPermission) {
    return (
      <MapAbleCard title="Emergency profile">
        <p className="text-sm text-muted-foreground">
          Emergency profile access is not granted. Ask the participant to enable this permission.
        </p>
      </MapAbleCard>
    );
  }

  return (
    <MapAbleCard title="Emergency profile">
      <p className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-200">
        <MapAbleStatusBadge status="consent_active" /> Emergency access — this view is logged
      </p>
      {profile ? (
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
          {JSON.stringify(profile, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-muted-foreground">No emergency profile on file.</p>
      )}
    </MapAbleCard>
  );
}
