import {
  EmptyState,
  TransparencyDisclaimer,
} from "@/app/transparency/_components";
import { getPublicGovernanceIncidentSummary } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function TransparencyIncidentsPage() {
  const rows = await getPublicGovernanceIncidentSummary();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          Governance incidents
        </h1>
        <p className="text-sm text-muted-foreground">
          Public incident reporting is aggregate only. It excludes reporter
          identity, affected participant details, exploit instructions and
          unresolved operational thresholds.
        </p>
      </header>
      <TransparencyDisclaimer />
      {rows.length === 0 ? (
        <EmptyState>
          No public-safe incident aggregates are currently available.
        </EmptyState>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Severity</th>
              <th className="py-2">Status</th>
              <th className="py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.severity}-${row.status}`} className="border-b">
                <td className="py-2">{row.severity}</td>
                <td className="py-2">{row.status}</td>
                <td className="py-2">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
