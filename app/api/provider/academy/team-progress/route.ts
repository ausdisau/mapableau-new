import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getTeamTrainingProgress } from "@/lib/academy/team-progress-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("care:read:org");
  if (user instanceof Response) return user;

  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) {
    return jsonError("No organisation membership", 403);
  }

  const progress = await getTeamTrainingProgress(membership.organisationId);
  return jsonOk({
    organisationId: membership.organisationId,
    members: progress.members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      enrolments: m.user.academyEnrolments.map((e) => ({
        courseTitle: e.course.title,
        status: e.status,
        progressPercent: e.progressPercent,
        hasCertificate: Boolean(e.certificate),
      })),
    })),
    requirements: progress.requirements.map((r) => ({
      courseTitle: r.course.title,
      requiredRole: r.requiredRole,
    })),
  });
}
