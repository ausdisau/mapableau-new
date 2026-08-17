import type { AccessNeedProfile } from "@/lib/digital-twin/types";

export function AccessPassSummary({ profile }: { profile: AccessNeedProfile }) {
  return (
    <article className="rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold">{profile.displayName}</h2>
      {profile.isDemoData && (
        <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-200">
          Demo profile — not linked to a real account
        </p>
      )}
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Mobility aids</dt>
          <dd className="text-muted-foreground">
            {profile.mobilityAids.length ? profile.mobilityAids.join(", ") : "None listed"}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Communication</dt>
          <dd className="text-muted-foreground">
            {profile.communicationPreferences.join(", ") || "None listed"}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Sensory preferences</dt>
          <dd className="text-muted-foreground">
            {profile.sensoryPreferences.join(", ") || "None listed"}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Transport needs</dt>
          <dd className="text-muted-foreground">
            {profile.transportNeeds.join(", ") || "None listed"}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Support preferences</dt>
          <dd className="text-muted-foreground">
            {profile.supportPreferences.join(", ") || "None listed"}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Sharing default</dt>
          <dd className="text-muted-foreground capitalize">{profile.shareDefault}</dd>
        </div>
      </dl>
    </article>
  );
}
