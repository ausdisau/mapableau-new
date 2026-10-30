import Link from "next/link";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const metadata = { title: "My assessment | MapAble" };
export default async function ParticipantAssessmentDashboard() {
  const user = await requireAuth();
  if (user.primaryRole !== "participant" && !user.roles.includes("participant")) redirect(defaultDashboardPath(user.primaryRole));
  const entries = await prisma.iCanV6IntakeSubmission.findMany({
    where: { participantId: user.id, status: { in: ["registration_lite", "registration_skipped", "submitted_draft"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, createdAt: true },
  });
  const latestCompleted = entries.find(e => e.status !== "registration_skipped");
  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">My support needs assessment</h1>
      <p>This is your MapAble planning workspace, not an official NDIA assessment or a clinical score.</p>
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
