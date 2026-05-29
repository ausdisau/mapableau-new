import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { workerId } = await params;
  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerId },
    select: {
      id: true,
      displayName: true,
      profileSummary: true,
      serviceTypes: true,
      serviceRegions: true,
      languages: true,
      verificationStatus: true,
      active: true,
      organisationId: true,
    },
  });
  if (!profile) return jsonError("Not found", 404);
  return jsonOk({ profile });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { workerId } = await params;
  const body = await req.json();
  const profile = await prisma.workerProfile.update({
    where: { id: workerId },
    data: {
      displayName: body.displayName,
      profileSummary: body.profileSummary,
      serviceTypes: body.serviceTypes,
    },
  });
  return jsonOk({ profile });
}
