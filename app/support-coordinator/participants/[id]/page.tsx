import Link from "next/link";

import { CoordinatorReferralTriage } from "@/components/care-support/CoordinatorReferralTriage";
import { requirePermission } from "@/lib/auth/guards";
import { getCoordinationTimeline } from "@/lib/care-support/coordination-service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function CoordinatorParticipantDetailPage({ params }: PageProps) {
  await requirePermission("coordinator:portal");
  const user = await getCurrentUser();
  if (!user) return null;

  const { id: participantId } = await params;

  let timeline;
  try {
    timeline = await getCoordinationTimeline(user.id, participantId);
  } catch {
    return (
      <div className="space-y-4 p-4">
        <h1 className="font-heading text-2xl font-bold">Access required</h1>
        <p className="text-muted-foreground">
          You do not have consent to view this participant. They must approve your coordinator
          access request.
        </p>
        <Link href="/support-coordinator/participants" className="text-primary underline">
          Back to participants
        </Link>
      </div>
    );
  }

  const participant = await prisma.user.findUnique({
    where: { id: participantId },
    select: { name: true, email: true },
  });

  const pendingReferrals = timeline.referrals.filter((r) =>
    ["submitted", "triaged"].includes(r.status)
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <Link href="/support-coordinator/participants" className="text-sm text-primary underline">
          ← Participants
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          {participant?.name ?? "Participant"}
        </h1>
        <p className="text-sm text-muted-foreground">{participant?.email}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Plan summary (authorised)</h2>
        <pre className="mt-2 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
          {JSON.stringify(timeline.planSummary, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Referral triage</h2>
        <CoordinatorReferralTriage
          participantId={participantId}
          referrals={pendingReferrals.map((r) => ({
            id: r.id,
            summary: r.summary,
            status: r.status,
            referralType: r.referralType,
            priority: r.priority,
          }))}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Coordination timeline</h2>
        <ol className="mt-2 space-y-2 border-l-2 pl-4">
          {timeline.events.map((e) => (
            <li key={`${e.type}-${e.id}`}>
              <time className="text-xs text-muted-foreground">
                {e.at.toLocaleDateString("en-AU")}
              </time>
              <p className="font-medium">{e.label}</p>
              {e.status ? (
                <p className="text-sm text-muted-foreground">{e.status}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
