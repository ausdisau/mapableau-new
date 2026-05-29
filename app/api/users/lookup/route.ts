import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getManageableOrganisationIds } from "@/lib/providers/can-manage-provider-workers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const manageable = await getManageableOrganisationIds(
    user.id,
    user.primaryRole
  );
  if (manageable.length === 0) {
    return jsonError("Forbidden", 403);
  }

  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return jsonError("email query parameter required", 400);
  }

  const found = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, primaryRole: true },
  });

  if (!found) {
    return jsonError("User not found", 404);
  }

  return jsonOk({
    userId: found.id,
    name: found.name,
    email: found.email,
    primaryRole: found.primaryRole,
  });
}
