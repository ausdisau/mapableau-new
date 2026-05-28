import Link from "next/link";
import { notFound } from "next/navigation";

import { AgreementLifecycleActions } from "@/components/service-agreements/AgreementLifecycleActions";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderServiceAgreementDetailPage({
  params,
}: {
  params: Promise<{ agreementId: string }>;
}) {
  const user = await requirePermission("agreement:manage:org");
  const { agreementId } = await params;
  const orgIds = await getUserOrganisationIds(user.id);

  const agreement = await prisma.serviceAgreement.findFirst({
    where: { id: agreementId, organisationId: { in: orgIds } },
  });
  if (!agreement) notFound();

  const revisions = await prisma.serviceAgreementRevision.findMany({
    where: { agreementId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/provider/service-agreements"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to agreements
        </Link>
      </p>

      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">{agreement.title}</h1>
        <p className="text-sm text-muted-foreground">
          Status: {agreement.status} · Type: {agreement.agreementType.replace(/_/g, " ")}
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {agreement.plainLanguageSummary}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Lifecycle actions</h2>
        <p className="mt-2 text-sm">
          Participant: {agreement.participantSignedAt ? "signed" : "pending"}
        </p>
        <p className="text-sm">
          Provider: {agreement.providerSignedAt ? "signed" : "pending"}
        </p>
        <div className="mt-3">
          <AgreementLifecycleActions
            agreementId={agreement.id}
            canSendForReview={agreement.status === "draft" || agreement.status === "participant_review"}
            canProviderSign={!agreement.providerSignedAt && agreement.status !== "cancelled" && agreement.status !== "expired"}
            canActivate={agreement.status === "signed"}
            canCancel={agreement.status !== "cancelled" && agreement.status !== "expired"}
            canAddRevision={agreement.status !== "cancelled" && agreement.status !== "expired"}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Negotiation revisions</h2>
        {revisions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No revisions recorded yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {revisions.map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{r.summary}</p>
                <p className="text-muted-foreground">
                  {r.createdAt.toLocaleString("en-AU")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
