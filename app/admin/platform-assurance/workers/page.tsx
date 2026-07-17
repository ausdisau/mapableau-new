import { redirect } from "next/navigation";

import { PlatformAssuranceShell } from "@/components/admin/platform-assurance/PlatformAssuranceShell";
import { requireAdmin } from "@/lib/auth/guards";
import {
  isPlatformAssuranceEnabled,
  isWorkerTrustCentreEnabled,
} from "@/lib/config/platform-assurance";
import { buildWorkerTrustGapReport } from "@/lib/worker-trust/gap-report";

export const dynamic = "force-dynamic";

export default async function PlatformAssuranceWorkersPage() {
  await requireAdmin();
  if (!isPlatformAssuranceEnabled() && !isWorkerTrustCentreEnabled()) {
    redirect("/admin?assurance=disabled");
  }

  const report = await buildWorkerTrustGapReport({
    screeningAdapterAvailable: false,
  });

  return (
    <PlatformAssuranceShell
      title="Worker trust gaps"
      description="Explicit trust states. Missing or unavailable checks are never shown as passed."
      pathname="/admin/platform-assurance/workers"
    >
      <p className="text-sm text-muted-foreground" role="note">
        {report.disclaimer}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Workers", report.summary.workers],
          ["With gaps", report.summary.withGaps],
          ["Screening unavailable", report.summary.screeningUnavailable],
          ["Screening not passed", report.summary.screeningNotPassed],
        ].map(([label, value]) => (
          <li key={label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          </li>
        ))}
      </ul>

      {report.rows.length === 0 ? (
        <p className="text-muted-foreground">No worker profiles found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Worker trust gap rows with screening and verification states
            </caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="p-2 font-medium">
                  Worker
                </th>
                <th scope="col" className="p-2 font-medium">
                  Screening
                </th>
                <th scope="col" className="p-2 font-medium">
                  Verification
                </th>
                <th scope="col" className="p-2 font-medium">
                  Gaps
                </th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.workerProfileId} className="border-b align-top">
                  <td className="p-2">
                    <div className="font-medium">{row.displayName}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {row.workerProfileId}
                    </div>
                  </td>
                  <td className="p-2">
                    <code>{row.screening}</code>
                  </td>
                  <td className="p-2">
                    <code>{row.verification}</code>
                  </td>
                  <td className="p-2">
                    {row.gapCodes.length === 0 ? (
                      <span className="text-muted-foreground">none</span>
                    ) : (
                      <ul className="list-inside list-disc">
                        {row.gapCodes.map((code) => (
                          <li key={code}>
                            <code>{code}</code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PlatformAssuranceShell>
  );
}
