import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { SupportNeedsAssessor } from "@/components/onboarding/SupportNeedsAssessor";
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
  const prior = await prisma.iCanV6IntakeSubmission.findFirst({
    where: {
      participantId: user.id,
      status: { in: ["registration_lite", "submitted_draft"] },
    },
    select: { id: true },
  });
  if (prior) redirect("/dashboard/assessment");
  return <SupportNeedsAssessor />;
}
