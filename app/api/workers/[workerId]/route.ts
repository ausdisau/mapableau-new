import { requireApiSession } from "@/lib/api/auth-handler";
import { userCanAccessWorker } from "@/lib/api/verification-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { patchWorkerProfileSchema } from "@/lib/validation/worker";

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
      contractorAbn: true,
      active: true,
      organisationId: true,
    },
  });
  if (!profile) return jsonError("Not found", 404);
  if (!(await userCanAccessWorker(user, workerId))) {
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
  if (!(await userCanAccessWorker(user, workerId))) {
    return jsonError("Forbidden", 403);
  }
  const body = await req.json();
  const parsed = patchWorkerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }
  const profile = await prisma.workerProfile.update({
    where: { id: workerId },
    data: {
      ...(parsed.data.displayName !== undefined && {
        displayName: parsed.data.displayName,
      }),
      ...(parsed.data.profileSummary !== undefined && {
        profileSummary: parsed.data.profileSummary,
      }),
      ...(parsed.data.serviceTypes !== undefined && {
        serviceTypes: parsed.data.serviceTypes,
      }),
      ...(parsed.data.contractorAbn !== undefined && {
        contractorAbn: parsed.data.contractorAbn,
      }),
    },
  });
  return jsonOk({ profile });
}
