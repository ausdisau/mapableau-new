import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { signServiceAgreement } from "@/lib/service-agreements/agreement-service";
import { ServiceAgreementLifecycleError } from "@/lib/service-agreements/lifecycle-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agreementId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { agreementId } = await params;
  const body = await req.json();
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: agreementId },
  });
  if (!agreement) return jsonError("Not found", 404);

  const role =
    body.role === "provider"
      ? hasPermission(user.primaryRole, "agreement:manage:org")
        ? "provider"
        : null
      : agreement.participantId === user.id
        ? "participant"
        : null;
  if (!role) return jsonError("Forbidden", 403);

  try {
    const updated = await signServiceAgreement({
      agreementId,
      signerUserId: user.id,
      role,
    });
    return jsonOk({ agreement: updated });
  } catch (error) {
    if (error instanceof ServiceAgreementLifecycleError) {
      if (error.code === "NOT_FOUND") return jsonError(error.message, 404);
      return jsonError(error.message, 400);
    }
    throw error;
  }
}
