import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase10Config } from "@/lib/config/phase10";
import { prisma } from "@/lib/prisma";

export async function submitApiCertificationApplication(params: {
  organisationId: string;
  appName: string;
}) {
  if (!phase10Config.apiCertificationProgramEnabled) {
    throw new Error("API_CERTIFICATION_DISABLED");
  }
  return prisma.apiCertificationApplication.create({
    data: { ...params, status: "submitted" },
  });
}

export async function certifyApiApplication(
  applicationId: string,
  actorUserId: string,
  reviewNotes?: string
) {
  const app = await prisma.apiCertificationApplication.update({
    where: { id: applicationId },
    data: {
      status: "certified",
      certifiedAt: new Date(),
      reviewNotes,
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "api_certification.certified",
    entityType: "ApiCertificationApplication",
    entityId: applicationId,
  });
  return app;
}

export async function listCertificationApplications() {
  return prisma.apiCertificationApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}
