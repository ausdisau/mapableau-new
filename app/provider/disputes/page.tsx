import Link from "next/link";

import { ProviderResponsePanel } from "@/components/disputes/ProviderResponsePanel";
import { DisputeTimeline } from "@/components/disputes/DisputeTimeline";
import { requireAuth } from "@/lib/auth/guards";
import {
  canRespondToDispute,
  getUserOrganisationIds,
} from "@/lib/disputes/access";
import { listDisputesForUser } from "@/lib/disputes/dispute-service";
import {
  DISPUTE_TYPE_LABELS,
  formatStatusLabel,
} from "@/lib/disputes/labels";
import { getDisputeById } from "@/lib/disputes/dispute-service";
export const metadata = { title: "Disputes | Provider" };

export default async function ProviderDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const sp = await searchParams;

  if (sp.id) {
    const dispute = await getDisputeById(sp.id);
    if (!dispute || !dispute.organisationId || !orgIds.includes(dispute.organisationId)) {
      return <p className="text-sm">Dispute not found.</p>;
    }
    const canRespond = await canRespondToDispute(user, dispute);
    return (
      <div className="space-y-6">
        <Link href="/provider/disputes" className="text-sm text-primary underline">
          Back to disputes
        </Link>
        <h1 className="font-heading text-2xl font-bold">{dispute.title}</h1>
        <p className="text-sm text-muted-foreground">
          {DISPUTE_TYPE_LABELS[dispute.type]} · {formatStatusLabel(dispute.status)}
        </p>
        <p className="text-sm">{dispute.description}</p>
        <ProviderResponsePanel
          disputeId={dispute.id}
          participantName={dispute.participant.name}
          canRespond={canRespond}
        />
        <DisputeTimeline
          events={dispute.events.map((e) => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      </div>
    );
  }

  const disputes = await listDisputesForUser({
    userId: user.id,
    organisationIds: orgIds,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Disputes</h1>
        <p className="text-muted-foreground">
          Disputes linked to your organisation. Participant names are shortened
          for privacy.
        </p>
      </header>
      <ul className="space-y-3">
        {disputes
          .filter((d) => d.organisationId && orgIds.includes(d.organisationId))
          .map((d) => (
            <li key={d.id} className="rounded-lg border p-4">
              <Link
                href={`/provider/disputes?id=${d.id}`}
                className="font-medium text-primary underline"
              >
                {d.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatStatusLabel(d.status)}
              </p>
            </li>
          ))}
      </ul>
    </div>
  );
}
