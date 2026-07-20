import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PractitionerAssessmentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  if (!pbsConfig.enabled) {
    return <p className="p-6">Module disabled.</p>;
  }
  await requireAuth();
  const { assessmentId } = await params;
  const assessment = await prisma.pbsAssessment.findUnique({
    where: { id: assessmentId },
    include: { behaviourDefinitions: true, workingHypotheses: true },
  });
  if (!assessment) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Assessment</h1>
      <p className="text-sm">
        Questionnaire alone cannot finalise an assessment. Functional behaviour
        assessment flag:{" "}
        {assessment.isFunctionalBehaviourAssessment ? "set by practitioner" : "false"}.
      </p>
      <p className="text-sm">
        Required sections complete:{" "}
        {assessment.requiredSectionsComplete ? "yes" : "no"}.
      </p>
    </div>
  );
}
