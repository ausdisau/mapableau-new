import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { assertHomeModificationAccess } from "@/lib/home-modifications/home-modification-service";
import { getProject, updateMilestone } from "@/lib/home-modifications/project-milestone-service";
import { milestoneUpdateSchema } from "@/lib/validation/home-modifications";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id: projectId } = await params;
  const body = await req.json();
  const { milestoneId, ...rest } = body;

  if (!milestoneId) {
    return jsonError("milestoneId is required", 400);
  }

  const project = await getProject({ projectId });
  if (!project) return jsonError(accessDeniedMessage("not_found"), 404);

  const allowed = await assertHomeModificationAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    participantId: project.participantId,
    providerId: project.providerId,
  });
  if (!allowed) return jsonError(accessDeniedMessage("no_permission"), 403);

  try {
    const parsed = milestoneUpdateSchema.parse(rest);
    const milestone = await updateMilestone({
      milestoneId,
      actorUserId: user.id,
      participantId: project.participantId,
      projectId,
      status: parsed.status,
    });
    return jsonOk({ milestone });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update milestone", 400);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const project = await prisma.homeModificationProject.findUnique({
    where: { id },
    include: { milestones: { orderBy: { sortOrder: "asc" } } },
  });
  if (!project) return jsonError("Not found", 404);

  const allowed = await assertHomeModificationAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    participantId: project.participantId,
    providerId: project.providerId,
  });
  if (!allowed) return jsonError(accessDeniedMessage("no_permission"), 403);

  return jsonOk({ project });
}
