import Link from "next/link";

import {
  EmptyState,
  TransparencyDisclaimer,
} from "@/app/transparency/_components";
import { listPublicRegisterSystems } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function TransparencySystemsPage() {
  const systems = await listPublicRegisterSystems();

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          Governed systems register
        </h1>
        <p className="text-sm text-muted-foreground">
          Public register entries describe what systems do, what they do not do,
          human review paths, limitations and how to challenge an outcome.
        </p>
      </header>
      <TransparencyDisclaimer />
      {systems.length === 0 ? (
        <EmptyState>
          No public governed systems have been published yet.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {systems.map((system) => (
            <li key={system.id} className="rounded border p-4">
              <Link
                href={`/transparency/systems/${encodeURIComponent(system.systemKey)}`}
                className="font-semibold underline-offset-4 hover:underline"
              >
                {system.publicTitle}
              </Link>
              <p className="mt-2 text-sm">{system.publicSummary}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <dt className="font-medium">Type</dt>
                <dd>{system.system.systemType}</dd>
                <dt className="font-medium">Decision role</dt>
                <dd>{system.system.decisionRole}</dd>
                <dt className="font-medium">Status</dt>
                <dd>{system.operatingStatus}</dd>
                <dt className="font-medium">Challenge</dt>
                <dd>{system.challengeHowTo}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
