import { requireAdmin } from "@/lib/auth/guards";
import { validateProductionEnv, safeEnvSummary } from "@/lib/env";

export const metadata = { title: "Release readiness | Admin" };

export default async function ReleaseReadinessPage() {
  await requireAdmin();
  const env = validateProductionEnv();
  const summary = safeEnvSummary();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Release readiness</h1>
      <ul className="space-y-2 text-sm">
        <li>Production env: {env.ok ? "OK" : `Missing: ${env.missing.join(", ")}`}</li>
        {Object.entries(summary).map(([k, v]) => (
          <li key={k}>
            {k}: {v}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Run <code className="rounded bg-muted px-1">npx tsx scripts/preflight-release.ts</code> before promoting to production.
      </p>
    </div>
  );
}
