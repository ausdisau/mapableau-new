import Link from "next/link";

import {
  EmptyState,
  TransparencyDisclaimer,
  TransparencyNav,
} from "@/app/transparency/_components";
import { listPublicRegisterSystems } from "@/lib/public-interest-governance/governance-service";
import { listPublicTransparency } from "@/lib/public-transparency/transparency-service";

export const dynamic = "force-dynamic";

export default async function TransparencyHubPage() {
  const [systems, publications] = await Promise.all([
    listPublicRegisterSystems(5),
    listPublicTransparency(),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Public transparency</h1>
        <p className="text-sm text-muted-foreground">
          Public-safe governance information for consequential systems, notices,
          appeals, incidents and community oversight.
        </p>
      </header>

      <TransparencyDisclaimer />
      <TransparencyNav />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recently published systems</h2>
        {systems.length === 0 ? (
          <EmptyState>
            No public governed systems have been published yet.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {systems.map((system) => (
              <li key={system.id} className="rounded border p-4">
                <Link
                  href={`/transparency/systems/${encodeURIComponent(system.systemKey)}`}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {system.publicTitle}
                </Link>
                <p className="mt-2 text-sm">{system.publicSummary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Published {system.publishedAt ?? "pending date"} · Not a
                  certification or endorsement.
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Approved transparency notes</h2>
        {publications.length === 0 ? (
          <EmptyState>
            No approved transparency notes are currently published.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {publications.map((publication) => (
              <li key={publication.id} className="rounded border p-4">
                <h3 className="font-semibold">{publication.title}</h3>
                <p className="mt-2 text-sm">{publication.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
