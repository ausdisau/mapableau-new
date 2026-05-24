import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { publicBadgeLabelForStatus } from "@/lib/verification/wwc/wwc-eligibility-service";
import { getWorkerProfileForUser } from "@/lib/verification/wwc/wwc-verification-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const worker = await getWorkerProfileForUser(user.id);
  if (!worker) {
    return jsonError("No worker profile", 404);
  }

  const verifications = await prisma.wwcVerification.findMany({
    where: { workerProfileId: worker.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      jurisdiction: true,
      checkType: true,
      status: true,
      expiresAt: true,
      updatedAt: true,
      evidenceDocumentId: true,
    },
  });

  const latest = verifications[0];

  return jsonOk({
    workerProfileId: worker.id,
    wwccStatus: worker.wwccStatus,
    verifications,
    publicBadge: {
      label: publicBadgeLabelForStatus(latest?.status ?? null),
      status: latest?.status ?? null,
    },
  });
}
