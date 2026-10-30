import Link from "next/link";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { isAssessmentRegistrationEnabled } from "@/lib/config/assessment-release";
import { classifyStoredSupportNeedsRecord } from "@/lib/intake/participant-support-snapshot";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const metadata = { title: "My assessment | MapAble" };
export default async function ParticipantAssessmentDashboard() {
  const user = await requireAuth();
  if (user.primaryRole !== "participant" && !user.roles.includes("participant")) redirect(defaultDashboardPath(user.primaryRole));
  if (!isAssessmentRegistrationEnabled()) redirect("/dashboard");
  const entries = await prisma.iCanV6IntakeSubmission.findMany({
    where: { participantId: user.id, status: { in: ["registration_lite", "registration_skipped", "submitted_draft"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, createdAt: true, payload: true },
  });
  const latestCompleted = entries.find(e => e.status === "registration_lite" && classifyStoredSupportNeedsRecord(e.payload) === "participant_self_report");
  const hasLegacy = entries.some(e => ["legacy_registration", "legacy_ican_draft"].includes(classifyStoredSupportNeedsRecord(e.payload)));
  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">My support needs assessment</h1>
      <p>This is your MapAble planning workspace, not an official NDIA assessment or a clinical score.</p>
      {hasLegacy ? <p role="status" className="rounded-xl border p-4">An earlier assessment draft is on record. It is kept separate and has not been converted into your own new statement.</p> : null}
      <div className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">Your statement</h2>
        <p className="mt-2">{latestCompleted ? `Recorded on ${latestCompleted.createdAt.toLocaleDateString("en-AU")}. Your original record is preserved.` : "You have not yet saved a support needs statement."}</p>
        <Link href={latestCompleted ? "/dashboard/assessment/review" : "/register/assessment"} className="mt-3 inline-block rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground">
          {latestCompleted ? "Review my assessment evidence" : "Record my support needs"}
        </Link>
      </div>
      <div className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">Compare a later report</h2>
        <p className="mt-2">Keep your original words distinct from the assessor's account. Note omissions, disagreements and unmet needs.</p>
        <Link href="/dashboard/assessment/review" className="mt-3 inline-block text-primary underline">Open report comparison workspace</Link>
      </div>
      <p className="text-sm text-muted-foreground">No report is sent to the NDIA automatically. Do not add clinical files to general registration fields.</p>
    </main>
  );
}
