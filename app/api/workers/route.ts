import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createWorkerProfile } from "@/lib/workers/worker-profile-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const workers = await prisma.workerProfile.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ workers });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!body.organisationId || !body.userId || !body.displayName) {
    return jsonError("organisationId, userId, displayName required", 400);
  }
  const profile = await createWorkerProfile({
    organisationId: body.organisationId,
    userId: body.userId,
    displayName: body.displayName,
    profileSummary: body.profileSummary,
    serviceTypes: body.serviceTypes,
    serviceRegions: body.serviceRegions,
    createdById: user.id,
  });
  return jsonOk({ profile }, 201);
}
