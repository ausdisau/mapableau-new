import Link from "next/link";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { LinkedParticipantList } from "@/components/plan-manager/LinkedParticipantList";
import { InvoiceInboxTable } from "@/components/plan-manager/InvoiceInboxTable";

export function PlanManagerDashboard({
  participants,
  invoices,
}: {
  participants: { participantId: string; displayName: string }[];
  invoices: {
    id: string;
    status: string;
    totalCents: number;
    inboxStatus?: string;
    organisation?: { name: string } | null;
  }[];
}) {
  return (
    <div className="space-y-6">
      <MapAbleCard
        title="Plan manager workspace"
        description="Review invoices and payment status. MapAble does not guarantee NDIS payment approval."
      >
        <p className="text-sm">
          Linked participants: {participants.length} · Invoices in inbox:{" "}
          {invoices.length}
        </p>
        <Link
          href="/plan-manager/invoices"
          className="mt-4 inline-flex min-h-11 items-center text-primary underline"
        >
          Open invoice inbox
        </Link>
      </MapAbleCard>
      <LinkedParticipantList participants={participants} />
      <InvoiceInboxTable invoices={invoices.slice(0, 5)} />
    </div>
  );
}
