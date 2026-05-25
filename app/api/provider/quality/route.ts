import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getProviderOwnQuality } from "@/lib/provider-quality/provider-quality-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });
  if (!membership) return jsonError("No organisation", 403);
  const profile = await getProviderOwnQuality(membership.organisationId);
  return jsonOk({ profile });
}
