import { notFound } from "next/navigation";

import { TransparencyDisclaimer } from "@/app/transparency/_components";
import { getPublicRegisterSystem } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function TransparencySystemDetailPage({
  params,
}: {
  params: Promise<{ systemKey: string }>;
}) {
  const { systemKey } = await params;
  const system = await getPublicRegisterSystem(decodeURIComponent(systemKey));
  if (!system) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          {system.publicTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {system.system.displayName} · {system.system.systemType}
        </p>
      </header>
      <TransparencyDisclaimer />

      <section className="rounded border p-4">
        <h2 className="font-semibold">Public explanation</h2>
        <p className="mt-2 text-sm">{system.publicSummary}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="font-semibold">What it does</h2>
          <p className="mt-2 text-sm">{system.system.businessPurpose}</p>
          <p className="mt-2 text-sm">{system.system.decisionRole}</p>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold">What it does not do</h2>
          <p className="mt-2 text-sm">{system.doesNotDoSummary}</p>
          <p className="mt-2 text-sm">{system.exclusionsPublic}</p>
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-semibold">Review, limits and challenge path</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <dt className="font-medium">Human review</dt>
          <dd>{system.humanReviewPublic}</dd>
          <dt className="font-medium">Known limitations</dt>
          <dd>{system.limitationsPublic}</dd>
          <dt className="font-medium">Who may be affected</dt>
          <dd>{system.affectedPeoplePublic}</dd>
          <dt className="font-medium">How to challenge</dt>
          <dd>{system.challengeHowTo}</dd>
        </dl>
      </section>
    </main>
  );
}
