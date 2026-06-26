import type { DemoConsentGrant } from "@/lib/digital-twin/access-pass";

export function ConsentGrantSummary({ grant }: { grant: DemoConsentGrant }) {
  return (
    <article className="rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold">Consent grant (demo)</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-medium">Who can see data</dt>
          <dd className="text-muted-foreground capitalize">
            {grant.recipientType.replace(/_/g, " ")}
            {grant.recipientId ? ` (${grant.recipientId})` : ""}
          </dd>
        </div>
        <div>
          <dt className="font-medium">What will be shared</dt>
          <dd className="text-muted-foreground">{grant.dataCategories.join(", ")}</dd>
        </div>
        <div>
          <dt className="font-medium">Why</dt>
          <dd className="text-muted-foreground">{grant.purpose}</dd>
        </div>
        <div>
          <dt className="font-medium">Expiry</dt>
          <dd className="text-muted-foreground">
            {grant.expiresAt
              ? new Date(grant.expiresAt).toLocaleDateString("en-AU")
              : "No expiry set"}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        Revoke option will be available when Access Pass persistence is connected to secure auth
        and consent storage.
      </p>
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="mt-3 min-h-11 rounded-xl border border-border px-4 text-sm opacity-50"
      >
        Revoke consent (placeholder)
      </button>
    </article>
  );
}
