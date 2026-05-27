import { ZodError } from "zod";

import {
  requireApiPermission,
  requireApiSession,
} from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { updateWorkerProfileSelf } from "@/lib/workers/worker-profile-service";
import {
  canAccessWorkerProfile,
  loadWorkerProfileOrNull,
} from "@/lib/workers/worker-profile-access";
import { workerProfileOrgSchema } from "@/lib/validation/worker";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { workerId } = await params;

  const profile = await loadWorkerProfileOrNull(workerId);
  if (!profile) return jsonError("Not found", 404);

  if (!(await canAccessWorkerProfile(user, profile))) {
    return jsonError("Forbidden", 403);
  }

  return jsonOk({ profile });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { workerId } = await params;

  const profile = await loadWorkerProfileOrNull(workerId);
  if (!profile) return jsonError("Not found", 404);

  if (!(await canAccessWorkerProfile(user, profile))) {
    return jsonError("Forbidden", 403);
  }

  const isSelf = profile.userId === user.id;
  const canManageOrg = hasPermission(user.primaryRole, "worker:manage:org");

  if (!isSelf && !canManageOrg) {
    return jsonError("Forbidden", 403);
  }

  if (isSelf && !hasPermission(user.primaryRole, "profile:write:self")) {
    return jsonError("Forbidden", 403);
  }

  try {
    const raw = await req.json();
    const parsed = workerProfileOrgSchema.parse(raw);

    if (isSelf) {
      await updateWorkerProfileSelf(profile.id, user.id, parsed);
      if (parsed.active !== undefined && canManageOrg) {
        await prisma.workerProfile.update({
          where: { id: profile.id },
          data: { active: parsed.active },
        });
      }
      const fresh = await loadWorkerProfileOrNull(workerId);
      return jsonOk({ profile: fresh ?? profile });
    }

    const updated = await prisma.workerProfile.update({
      where: { id: workerId },
      data: {
        displayName: parsed.displayName,
        profileSummary: parsed.profileSummary,
        serviceTypes: parsed.serviceTypes,
        serviceRegions: parsed.serviceRegions,
        specialisations: parsed.specialisations,
        languages: parsed.languages,
        active: parsed.active,
      },
    });
    return jsonOk({ profile: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}
