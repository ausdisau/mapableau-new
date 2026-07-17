import {
  EmptyState,
  TransparencyDisclaimer,
} from "@/app/transparency/_components";
import { getPublicDecisionTransparencySummary } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function TransparencyDecisionsPage() {
  const rows = await getPublicDecisionTransparencySummary();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          Decision transparency
        </h1>
        <p className="text-sm text-muted-foreground">
          Consequential decision notices must explain the outcome, effect,
          evidence-backed reasons and appeal pathway without chain-of-thought.
        </p>
      </header>
      <TransparencyDisclaimer />
      <section className="rounded border p-4 text-sm">
        <h2 className="font-semibold">Notice commitments</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            No opaque scoring: notices state recorded reasons and uncertainty.
          </li>
          <li>
            No autonomous legal, clinical, safeguarding or financial
            decision-making.
          </li>
          <li>
            No automated regulator submissions from a notice or appeal pathway.
          </li>
        </ul>
      </section>
      {rows.length === 0 ? (
        <EmptyState>
          No public-safe decision aggregates are currently available.
        </EmptyState>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Impact</th>
              <th className="py-2">Status</th>
              <th className="py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.impact}-${row.status}`} className="border-b">
                <td className="py-2">{row.impact}</td>
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
