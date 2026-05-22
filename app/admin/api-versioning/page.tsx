import { requireAdmin } from "@/lib/auth/guards";
import { getApiVersionPolicy } from "@/lib/api-versioning/version-policy-service";

export default async function ApiVersioningPage() {
  await requireAdmin();
  const policy = await getApiVersionPolicy();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Public API versioning</h1>
      <p className="text-sm">Default: {policy.defaultVersion}</p>
      <p className="text-sm text-muted-foreground">{policy.deprecationNotice}</p>
      <ul className="space-y-2">
        {policy.versions.map((v) => (
          <li key={v.id} className="rounded border p-3">
            {v.version} — {v.status}
            {v.changelog ? <p className="text-xs">{v.changelog}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
