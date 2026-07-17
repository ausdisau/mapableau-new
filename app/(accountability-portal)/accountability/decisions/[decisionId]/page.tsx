import Link from "next/link";
import { notFound } from "next/navigation";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { prisma } from "@/lib/prisma";

export default async function GovernanceDecisionDetailPage({
  params,
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = await params;
  const decision = await prisma.accountabilityGovernanceDecision.findFirst({
    where: { publicId: decisionId, status: "published" },
  });
  if (!decision) notFound();

  return (
    <article className="space-y-6">
      <p className="text-sm">
        <Link href="/accountability/governance" className="text-primary hover:underline">
          Governance
        </Link>
        <span className="text-muted-foreground"> / {decision.publicId}</span>
      </p>
      <DemonstrationBanner show={decision.isDemonstration} />
      <h1 className="font-heading text-3xl font-bold">{decision.questionConsidered}</h1>
      <p className="text-sm text-muted-foreground">
        {decision.decisionBody} ·{" "}
        {decision.decisionDate.toLocaleDateString("en-AU")}
      </p>
      <section>
        <h2 className="font-heading text-xl font-semibold">Decision summary</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">{decision.decisionSummary}</p>
      </section>
      {decision.optionsConsidered ? (
        <section>
          <h2 className="font-heading text-lg font-semibold">Options considered</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{decision.optionsConsidered}</p>
        </section>
      ) : null}
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Participant-rights implications</dt>
          <dd>{decision.participantRightsImplications ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Accessibility implications</dt>
          <dd>{decision.accessibilityImplications ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Privacy implications</dt>
          <dd>{decision.privacyImplications ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Implementation owner</dt>
          <dd>{decision.implementationOwner ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
