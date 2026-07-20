import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PractitionerPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  if (!pbsConfig.enabled) {
    return <p className="p-6">Module disabled.</p>;
  }
  const user = await requireAuth();
  const { planId } = await params;
  const plan = await prisma.pbsPlan.findUnique({
    where: { id: planId },
    include: {
      restrictivePractices: true,
      consultations: true,
      participantFeedback: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 3 },
    },
  });
  if (!plan) notFound();
  if (plan.practitionerUserId && plan.practitionerUserId !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Plan (practitioner)</h1>
      <p className="text-sm">
        {plan.planType} · {plan.status} · v{plan.currentVersionNumber}
      </p>
      <p className="text-sm">
        Finalisation requires verified suitability, consultation evidence,
        participant feedback (or documented reason), conflict acknowledgement,
        practitioner declaration, current checklist version, and a passing
        restrictive-practice gate.
      </p>
      <p className="text-sm">
        RP records: {plan.restrictivePractices.length}. AI proposals never write
        directly to a final plan.
      </p>
    </div>
  );
}
