import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

export function ConsentStatusBanner({
  consentActive,
  message,
}: {
  consentActive: boolean;
  message?: string | null;
}) {
  if (consentActive) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950"
      >
        <p className="font-medium">
          <MapAbleStatusBadge status="consent_active" /> Consent is active
        </p>
        <p className="mt-1 text-sm">
          You can view authorised participant information only.
        </p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950"
    >
      <p className="font-medium">
        <MapAbleStatusBadge status="consent_required" /> Consent required
      </p>
      <p className="mt-1 text-sm">
        {message ??
          "This participant has not granted consent. Sensitive information is hidden."}
      </p>
    </div>
  );
}

export function ParticipantOverviewPanel({
  consentActive,
  profile,
  bookingCount,
}: {
  consentActive: boolean;
  profile?: { displayName?: string | null; preferredName?: string | null; homeSuburb?: string | null } | null;
  bookingCount?: number;
}) {
  if (!consentActive) {
    return (
      <MapAbleCard title="Participant overview">
        <p className="text-sm text-muted-foreground">
          Overview hidden until consent is granted.
        </p>
      </MapAbleCard>
    );
  }

  return (
    <MapAbleCard
      title="Participant overview"
      description="Authorised summary — sensitive notes excluded."
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Name</dt>
          <dd>{profile?.preferredName ?? profile?.displayName ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">Home suburb</dt>
          <dd>{profile?.homeSuburb ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">Active bookings</dt>
          <dd>{bookingCount ?? 0}</dd>
        </div>
      </dl>
    </MapAbleCard>
  );
}
