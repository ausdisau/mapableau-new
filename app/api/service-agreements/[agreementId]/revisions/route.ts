import { z } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";
import {
  listAgreementRevisions,
  markNegotiationUpdate,
  ServiceAgreementLifecycleError,
} from "@/lib/service-agreements/lifecycle-service";

const revisionSchema = z.object({
  summary: z.string().min(1).max(500),
  changeSetJson: z.record(z.string(), z.unknown()).optional(),
});

async function canReadAgreement(agreementId: string, userId: string, role: string) {
  if (role === "mapable_admin") {
    return prisma.serviceAgreement.findFirst({ where: { id: agreementId } });
  }
  const orgIds = await getUserOrganisationIds(userId);
  const where = {
    id: agreementId,
    OR: [
      { participantId: userId },
      { createdById: userId },
      { organisationId: { in: orgIds } },
    ],
  };
  return prisma.serviceAgreement.findFirst({ where });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agreementId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { agreementId } = await params;
  const agreement = await canReadAgreement(
    agreementId,
    user.id,
    user.primaryRole
  );
  if (!agreement) return jsonError("Not found", 404);
  const revisions = await listAgreementRevisions(agreementId);
  return jsonOk({ revisions });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agreementId: string }> }
) {
  const user = await requireApiPermission("agreement:manage:org");
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = revisionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { agreementId } = await params;
  try {
    const result = await markNegotiationUpdate({
      agreementId,
      authorUserId: user.id,
      summary: parsed.data.summary,
      changeSetJson: parsed.data.changeSetJson,
    });
    return jsonOk(result);
  } catch (error) {
    if (error instanceof ServiceAgreementLifecycleError) {
      if (error.code === "NOT_FOUND") return jsonError(error.message, 404);
      return jsonError(error.message, 400);
    }
    throw error;
  }
}
