import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canManageProviderById } from "@/lib/providers/can-manage-provider-workers";
import { prisma } from "@/lib/prisma";
import { endWorkerAffiliation } from "@/lib/workers/worker-profile-service";
import { isValidProviderId } from "@/app/utils/provider-admin";

type RouteContext = {
  params: Promise<{ providerId: string; workerProfileId: string }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { providerId, workerProfileId } = await context.params;
  if (!isValidProviderId(providerId)) {
    return jsonError("Invalid provider id", 400);
  }

  const allowed = await canManageProviderById(
    user.id,
    providerId,
    user.primaryRole
  );
  if (!allowed) return jsonError("Forbidden", 403);

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { organisationId: true },
  });
  if (!provider?.organisationId) {
    return jsonError("Provider organisation not found", 404);
  }

  const profile = await prisma.workerProfile.findFirst({
    where: {
      id: workerProfileId,
      organisationId: provider.organisationId,
    },
  });
  if (!profile) return jsonError("Worker profile not found for this provider", 404);

  const ended = await endWorkerAffiliation({
    workerProfileId,
    endedById: user.id,
  });

  return jsonOk({ profile: ended });
}
