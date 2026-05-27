import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canManageProviderById } from "@/lib/providers/can-manage-provider-workers";
import { ensureProviderOrganisation } from "@/lib/providers/ensure-provider-organisation";
import { prisma } from "@/lib/prisma";
import { affiliateWorkerSchema } from "@/lib/validation/worker-affiliation";
import { affiliateWorkerToOrganisation } from "@/lib/workers/worker-profile-service";
import { isValidProviderId } from "@/app/utils/provider-admin";

type RouteContext = { params: Promise<{ providerId: string }> };

export async function POST(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { providerId } = await context.params;
  if (!isValidProviderId(providerId)) {
    return jsonError("Invalid provider id", 400);
  }

  const allowed = await canManageProviderById(
    user.id,
    providerId,
    user.primaryRole
  );
  if (!allowed) return jsonError("Forbidden", 403);

  const organisationId = await ensureProviderOrganisation(providerId);
  if (!organisationId) return jsonError("Provider organisation not found", 404);

  const body = await req.json();
  const parsed = affiliateWorkerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.flatten().formErrors.join(", ") || "Invalid body", 400);
  }

  let userId = parsed.data.userId;
  if (!userId && parsed.data.email) {
    const target = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, name: true },
    });
    if (!target) {
      return jsonError(
        "No user found with that email. They must register first.",
        404
      );
    }
    userId = target.id;
    if (!parsed.data.displayName) {
      parsed.data.displayName = target.name;
    }
  }

  if (!userId) return jsonError("userId required", 400);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  if (!targetUser) return jsonError("User not found", 404);

  const displayName =
    parsed.data.displayName?.trim() || targetUser.name || "Worker";

  const profile = await affiliateWorkerToOrganisation({
    userId,
    organisationId,
    displayName,
    profileSummary: parsed.data.profileSummary,
    createdById: user.id,
    affiliationStatus: "active",
    invitedByUserId: user.id,
  });

  return jsonOk({ profile }, 201);
}
