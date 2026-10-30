import { redirect } from "next/navigation";

import { SupportNeedsAssessor } from "@/components/onboarding/SupportNeedsAssessor";
import { requireAuth } from "@/lib/auth/guards";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { isAssessmentRegistrationEnabled } from "@/lib/config/assessment-release";
import { classifyStoredSupportNeedsRecord } from "@/lib/intake/participant-support-snapshot";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Your support needs | MapAble",
  description: "Optional participant-authored support needs statement.",
};
export default async function RegisterAssessmentPage() {
  const user = await requireAuth();
  if (user.primaryRole !== "participant" && !user.roles.includes("participant")) {
    redirect(defaultDashboardPath(user.primaryRole));
  }
  if (!isAssessmentRegistrationEnabled()) redirect("/dashboard");
  const prior = await prisma.iCanV6IntakeSubmission.findMany({
    where: {
      participantId: user.id,
      status: "registration_lite",
    },
    select: { payload: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  if (prior.some((entry) => classifyStoredSupportNeedsRecord(entry.payload) === "participant_self_report")) {
    redirect("/dashboard/assessment");
  }
  return <SupportNeedsAssessor />;
}
