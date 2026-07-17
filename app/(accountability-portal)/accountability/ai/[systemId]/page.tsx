import Link from "next/link";
import { notFound } from "next/navigation";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { prisma } from "@/lib/prisma";

export default async function AiSystemDetailPage({
  params,
}: {
  params: Promise<{ systemId: string }>;
}) {
  const { systemId } = await params;
  const system = await prisma.accountabilityAiSystem.findFirst({
    where: { publicCode: systemId, status: "published" },
  });
  if (!system) notFound();

  return (
    <article className="space-y-6">
      <p className="text-sm">
        <Link href="/accountability/ai" className="text-primary hover:underline">
          AI register
        </Link>
        <span className="text-muted-foreground"> / {system.publicCode}</span>
      </p>
      <DemonstrationBanner show={system.isDemonstration} />
      <h1 className="font-heading text-3xl font-bold">{system.name}</h1>
      <p className="text-muted-foreground">{system.purpose}</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Decision role</dt>
          <dd>{system.decisionRole}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Human review required</dt>
          <dd>{system.humanReviewRequired ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Service vertical</dt>
          <dd>{system.serviceVertical ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Version</dt>
          <dd>{system.modelOrRuleVersion ?? "—"}</dd>
        </div>
      </dl>
      <section>
        <h2 className="font-heading text-lg font-semibold">Known limitations</h2>
        <p className="mt-2 text-sm whitespace-pre-wrap">
          {system.knownLimitations ?? "—"}
        </p>
      </section>
      <section>
        <h2 className="font-heading text-lg font-semibold">Appeal or challenge pathway</h2>
        <p className="mt-2 text-sm whitespace-pre-wrap">
          {system.appealPathway ?? "Use /accountability/submit to challenge this statement."}
        </p>
      </section>
    </article>
  );
}
