import Link from "next/link";

import { checkArchitectureDrift } from "@/lib/assurance/architecture/drift-check";
import { requireAdmin } from "@/lib/auth/guards";
import { phase5Config } from "@/lib/config/phase5";

export default async function AssuranceArchitecturePage() {
  await requireAdmin();

  const findings = checkArchitectureDrift({
    expectedAdapterModes: ["ndia_simulator", "ndia_manual_portal", "ndia_direct_future"],
    actualAdapterModes: ["ndia_simulator", "ndia_manual_portal", "ndia_direct_future"],
    directNdiaWithoutApproval: phase5Config.ndiaRealSubmissionEnabled,
  });

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Architecture evidence</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Architecture drift findings are advisory. Direct NDIA without approval is high
        severity. Not an NDIA technical assessment.
      </p>
      <p className="text-sm">
        NDIA real submission enabled: {phase5Config.ndiaRealSubmissionEnabled ? "yes" : "no"}
      </p>
      <p className="text-sm text-muted-foreground">
        See docs/assurance/architecture-evidence.md for drift check details.
      </p>
      {findings.length === 0 ? (
        <p>No architecture drift findings.</p>
      ) : (
        <ul className="space-y-3">
          {findings.map((finding) => (
            <li key={finding.code} className="rounded-lg border p-4">
              <div className="font-medium">
                {finding.code} ({finding.severity})
              </div>
              <p className="text-sm">{finding.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
