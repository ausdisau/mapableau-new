import Link from "next/link";
import { notFound } from "next/navigation";

import { DisputeTimeline } from "@/components/disputes/DisputeTimeline";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessDispute } from "@/lib/disputes/access";
import { getDisputeById } from "@/lib/disputes/dispute-service";
import {
  DISPUTE_TYPE_LABELS,
  formatStatusLabel,
} from "@/lib/disputes/labels";

export const metadata = { title: "Dispute details | MapAble Core" };

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute) notFound();

  if (!(await canAccessDispute(user, dispute))) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <Link href="/dashboard/disputes" className="text-sm text-primary underline">
          Back to disputes
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">{dispute.title}</h1>
        <p className="text-sm text-muted-foreground">
          {DISPUTE_TYPE_LABELS[dispute.type]} · Status:{" "}
          <span>{formatStatusLabel(dispute.status)}</span>
        </p>
      </header>

      <section aria-labelledby="dispute-description-heading">
        <h2 id="dispute-description-heading" className="font-heading text-lg font-semibold">
          What you told us
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">{dispute.description}</p>
        {dispute.desiredOutcome ? (
          <p className="mt-4 text-sm">
            <strong>Outcome you asked for:</strong> {dispute.desiredOutcome}
          </p>
        ) : null}
      </section>

      {dispute.resolutionSummary ? (
        <section aria-labelledby="dispute-resolution-heading">
          <h2
            id="dispute-resolution-heading"
            className="font-heading text-lg font-semibold"
          >
            Resolution
          </h2>
          <p className="mt-2 text-sm">{dispute.resolutionSummary}</p>
        </section>
      ) : null}

      <DisputeTimeline
        events={dispute.events.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        }))}
      />

    </div>
  );
}
