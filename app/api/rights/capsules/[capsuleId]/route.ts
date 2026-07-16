import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isAccessCapsulesEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import { revokeCapsule, verifyCapsule } from "@/lib/rights-os/capsules/capsule-service";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ capsuleId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  if (!isRightsOsEnabled() || !isAccessCapsulesEnabled()) {
    return jsonError("Access Capsules are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { capsuleId } = await params;
  const capsule = await prisma.accessCapsule.findFirst({
    where: { id: capsuleId, subjectUserId: user.id },
  });

  if (!capsule) return jsonError("Not found", 404);
  return jsonOk({ capsule });
}

export async function POST(req: Request, { params }: RouteParams) {
  if (!isRightsOsEnabled() || !isAccessCapsulesEnabled()) {
    return jsonError("Access Capsules are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { capsuleId } = await params;
  const body = (await req.json()) as { action?: string; token?: string };

  if (body.action === "revoke") {
    const capsule = await prisma.accessCapsule.findFirst({
      where: { id: capsuleId, subjectUserId: user.id },
    });
    if (!capsule) return jsonError("Not found", 404);
    const revoked = await revokeCapsule(capsuleId, user.id);
    return jsonOk({ capsule: revoked });
  }

  if (body.action === "verify" && body.token) {
    const result = await verifyCapsule({
      capsuleId,
      token: body.token,
      verifierActorId: user.id,
    });
    return jsonOk(result);
  }

  return jsonError("Invalid action", 400);
}
