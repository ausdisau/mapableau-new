import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { isAssessmentIntakeEnabled } from "@/lib/config/assessment-release";
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
  if (!isAssessmentIntakeEnabled()) {
    return <main className="mx-auto max-w-2xl space-y-4 px-4 py-12">
      <h1 className="text-2xl font-semibold">Assessment registration is not available yet</h1>
      <p>You can use your MapAble account without completing a support needs assessment. We are reviewing privacy, security and accessibility safeguards before opening this optional feature.</p>
      <Link className="text-primary underline" href="/dashboard">Continue to MapAble</Link>
    </main>;
  }
  return <SupportNeedsAssessor />;
}
