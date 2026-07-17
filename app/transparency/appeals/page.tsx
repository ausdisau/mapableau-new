import {
  EmptyState,
  TransparencyDisclaimer,
} from "@/app/transparency/_components";
import { getPublicAppealTransparencySummary } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function TransparencyAppealsPage() {
  const rows = await getPublicAppealTransparencySummary();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Appeals process</h1>
        <p className="text-sm text-muted-foreground">
          Public process description only. Individual appeal content, evidence,
          participant details and reviewers are never published here.
        </p>
      </header>
      <TransparencyDisclaimer />
      <section className="rounded border p-4 text-sm">
        <h2 className="font-semibold">How to challenge a decision</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Use the decision notice or participant appeals page to submit
            grounds.
          </li>
          <li>
            Service access must continue where it is safe and lawful to do so.
          </li>
          <li>
            Appeals must not retaliate against a participant, advocate or
            reporter.
          </li>
          <li>
            An independent reviewer must be assigned before a final decision.
          </li>
          <li>
            Remedies are tracked when a decision is varied, remitted or
            overturned.
          </li>
        </ol>
      </section>
      {rows.length === 0 ? (
        <EmptyState>
          No public-safe appeal aggregates are currently available.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <li key={row.status} className="rounded border p-4">
              <p className="text-sm font-medium">{row.status}</p>
              <p className="text-2xl font-bold">{row.count}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
