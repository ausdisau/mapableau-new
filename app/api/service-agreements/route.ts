import { requireApiAdmin, requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  createServiceAgreement,
  sendAgreementForReview,
} from "@/lib/service-agreements/agreement-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const participantId = searchParams.get("participantId");
  const organisationId = searchParams.get("organisationId");
  const where = isAdminRole(user.primaryRole)
    ? {
        ...(status ? { status: status as never } : {}),
        ...(participantId ? { participantId } : {}),
        ...(organisationId ? { organisationId } : {}),
      }
    : {
        participantId: user.id,
        ...(status ? { status: status as never } : {}),
      };
  const agreements = await prisma.serviceAgreement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ agreements });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const agreement = await createServiceAgreement({
    participantId: body.participantId,
    organisationId: body.organisationId,
    agreementType: body.agreementType,
    title: body.title,
    plainLanguageSummary: body.plainLanguageSummary,
    startDate: new Date(body.startDate),
    endDate: body.endDate ? new Date(body.endDate) : undefined,
    createdById: user.id,
    fundingSourceId: body.fundingSourceId,
  });
  if (body.sendForReview) {
    await sendAgreementForReview(agreement.id, user.id);
  }
  return jsonOk({ agreement }, 201);
}
