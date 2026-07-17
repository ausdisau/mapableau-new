import Link from "next/link";
import { notFound } from "next/navigation";

import { DemonstrationBanner } from "@/components/accountability/DemonstrationBanner";
import { prisma } from "@/lib/prisma";

export default async function CommitmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const commitment = await prisma.accountabilityCommitment.findUnique({
    where: { slug },
    include: { updates: { orderBy: { publishedAt: "desc" } } },
  });
  if (!commitment) notFound();

  return (
    <article className="space-y-6">
      <p className="text-sm">
        <Link href="/accountability/commitments" className="text-primary hover:underline">
          Commitments
        </Link>
        <span className="text-muted-foreground"> / {commitment.slug}</span>
      </p>
      <DemonstrationBanner show={commitment.isDemonstration} />
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">{commitment.title}</h1>
        <p className="text-muted-foreground">{commitment.plainLanguage}</p>
      </header>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd>{commitment.status.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Accountable body</dt>
          <dd>{commitment.accountableBody}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Service vertical</dt>
          <dd>{commitment.serviceVertical ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Target date</dt>
          <dd>
            {commitment.targetDate
              ? commitment.targetDate.toLocaleDateString("en-AU")
              : "—"}
          </dd>
        </div>
      </dl>
      {commitment.status === "withdrawn" ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <h2 className="font-semibold">Withdrawn commitment</h2>
          <p className="mt-2">
            Withdrawal date:{" "}
            {commitment.withdrawalDate?.toLocaleDateString("en-AU") ?? "—"}
          </p>
          <p className="mt-1">Reason: {commitment.withdrawalReason ?? "—"}</p>
          <p className="mt-1">
            Approving authority: {commitment.withdrawalAuthority ?? "—"}
          </p>
          {commitment.replacementCommitmentSlug ? (
            <p className="mt-1">
              Replacement:{" "}
              <Link
                href={`/accountability/commitments/${commitment.replacementCommitmentSlug}`}
                className="text-primary hover:underline"
              >
                {commitment.replacementCommitmentSlug}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}
      {commitment.delayReason ? (
        <section>
          <h2 className="font-heading text-lg font-semibold">Reason for delay</h2>
          <p className="mt-1 text-sm">{commitment.delayReason}</p>
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Update history</h2>
        {commitment.updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public updates yet.</p>
        ) : (
          <ol className="space-y-3">
            {commitment.updates.map((u) => (
              <li key={u.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium">
                  {u.status.replace(/_/g, " ")} ·{" "}
                  {u.publishedAt.toLocaleDateString("en-AU")}
                </p>
                <p className="mt-1">{u.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
