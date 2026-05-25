import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { getTeamTrainingProgress } from "@/lib/academy/team-progress-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Team training | Provider" };

export default async function ProviderTeamAcademyPage() {
  const user = await requirePermission("care:read:org");
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });
  if (!membership) {
    return (
      <div className="p-6">
        <p role="status">Link your account to an organisation to view team training.</p>
      </div>
    );
  }

  const { members, requirements } = await getTeamTrainingProgress(
    membership.organisationId,
  );

  return (
    <div className="space-y-6 p-6">
      <Link href="/provider" className="text-sm text-primary underline">
        ← Provider home
      </Link>
      <h1 className="font-heading text-2xl font-bold">Team training progress</h1>
      {requirements.length > 0 ? (
        <section>
          <h2 className="font-medium">Required courses</h2>
          <ul className="mt-2 text-sm space-y-1">
            {requirements.map((r) => (
              <li key={r.id}>
                {r.course.title} — {r.requiredRole.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section>
        <h2 className="font-medium">Team members</h2>
        <ul className="mt-3 space-y-4">
          {members.map((m) => (
            <li key={m.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{m.user.name}</p>
              <p className="text-sm text-muted-foreground">{m.user.email}</p>
              {m.user.academyEnrolments.length === 0 ? (
                <p className="mt-2 text-sm">No academy enrolments</p>
              ) : (
                <ul className="mt-2 text-sm space-y-1">
                  {m.user.academyEnrolments.map((e) => (
                    <li key={e.id}>
                      {e.course.title}: {e.progressPercent}% — {e.status}
                      {e.certificate ? " ✓ certified" : ""}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
