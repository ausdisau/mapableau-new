import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PractitionerEngagementPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  if (!pbsConfig.enabled) {
    return <p className="p-6">Module disabled.</p>;
  }
  const user = await requireAuth();
  const { engagementId } = await params;
  const engagement = await prisma.pbsEngagement.findUnique({
    where: { id: engagementId },
    include: {
      assignedPractitionerProfile: true,
      assessments: true,
      plans: true,
      questionnaireSessions: true,
    },
  });
  if (!engagement) notFound();
  if (engagement.assignedPractitionerProfile?.userId !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Engagement</h1>
      <p className="text-sm">Status: {engagement.status}</p>
      <ul className="space-y-2 text-sm">
        {engagement.assessments.map((a) => (
          <li key={a.id}>
            <Link
              className="underline"
              href={`/practitioner/positive-behaviour-support/assessments/${a.id}`}
            >
              Assessment {a.id.slice(0, 8)}
            </Link>
          </li>
        ))}
        {engagement.plans.map((p) => (
          <li key={p.id}>
            <Link
              className="underline"
              href={`/practitioner/positive-behaviour-support/plans/${p.id}`}
            >
              Plan {p.planType} · {p.status}
            </Link>
          </li>
        ))}
        {engagement.questionnaireSessions.map((s) => (
          <li key={s.id}>
            Questionnaire session {s.id.slice(0, 8)} · {s.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
