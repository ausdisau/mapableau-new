import {
  assessReleaseReadiness,
  listReleaseManifests,
} from "@/lib/ai/platform/release-governance";
import { requireAdmin } from "@/lib/auth/guards";
import { isReleaseGovernanceEnabled } from "@/lib/config/release-governance";

export default async function AdminAiReleaseReadinessPage() {
  await requireAdmin();

  if (!isReleaseGovernanceEnabled()) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <h1 className="font-heading text-2xl font-bold">
          Release readiness
        </h1>
        <p className="max-w-3xl text-muted-foreground" role="status">
          Release governance is disabled. Set{" "}
          <code>MAPABLE_RELEASE_GOVERNANCE_ENABLED=true</code> in a
          non-production environment to view readiness gates. This page is
          read-only and never enables pilots or production releases.
        </p>
      </div>
    );
  }

  const manifests = listReleaseManifests();
  const rows = manifests.map((manifest) => ({
    manifest,
    assessment: assessReleaseReadiness(manifest),
  }));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Release readiness</h1>
        <p className="max-w-3xl text-muted-foreground">
          Deterministic GO/NO-GO view for Agentic Nerve Centre capabilities.
          Verdicts are evidence-derived only. There is no one-click ship
          control. Approvals stay null until real human sign-off.
        </p>
        <p className="text-sm" role="status" aria-live="polite">
          Governance enforcement active · {rows.length} manifests · pilot flags
          remain off
        </p>
      </header>

      <section aria-labelledby="manifests-heading" className="space-y-2">
        <h2 id="manifests-heading" className="text-lg font-semibold">
          Capability release manifests
        </h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Release readiness assessment for each capability manifest
            </caption>
            <thead className="bg-muted/40">
              <tr>
                <th scope="col" className="p-3 font-semibold">
                  Capability
                </th>
                <th scope="col" className="p-3 font-semibold">
                  State
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Verdict
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Owner
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Approval
                </th>
                <th scope="col" className="p-3 font-semibold">
                  Blocking gates
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ manifest, assessment }) => (
                <tr key={manifest.capabilityKey} className="border-t">
                  <td className="p-3 font-mono text-xs">
                    {manifest.capabilityKey}
                    <div className="text-muted-foreground">
                      v{manifest.version}
                    </div>
                  </td>
                  <td className="p-3">{manifest.releaseState}</td>
                  <td className="p-3 font-medium">{assessment.verdict}</td>
                  <td className="p-3">{manifest.owner}</td>
                  <td className="p-3 text-muted-foreground">
                    {manifest.approvedBy
                      ? `${manifest.approvedBy} @ ${manifest.approvedAt}`
                      : "not approved"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {assessment.failures.length === 0
                      ? "—"
                      : assessment.failures
                          .slice(0, 4)
                          .map((f) => f.code)
                          .join(", ")}
                    {assessment.failures.length > 4
                      ? ` (+${assessment.failures.length - 4})`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="legend-heading" className="space-y-2">
        <h2 id="legend-heading" className="text-lg font-semibold">
          Verdict legend
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <strong>READY_FOR_REVIEW</strong> — evidence pack complete; human
            review still required. Not auto-approved.
          </li>
          <li>
            <strong>NOT_READY</strong> — missing required evidence gates.
          </li>
          <li>
            <strong>BLOCKED</strong> — suspended/retired, expired approval, or
            governance flag off.
          </li>
        </ul>
      </section>
    </div>
  );
}
