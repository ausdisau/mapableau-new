import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  activateAgreement,
  ServiceAgreementLifecycleError,
} from "@/lib/service-agreements/lifecycle-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agreementId: string }> }
) {
  const user = await requireApiPermission("agreement:manage:org");
  if (user instanceof Response) return user;
  const { agreementId } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const result = await activateAgreement({
      agreementId,
      actorUserId: user.id,
      complianceContractCode: body.complianceContractCode,
    });
    return jsonOk(result);
  } catch (error) {
    if (error instanceof ServiceAgreementLifecycleError) {
      if (error.code === "NOT_FOUND") return jsonError(error.message, 404);
      if (error.code === "COMPLIANCE_BLOCKED") {
        return Response.json(
          { error: error.message, details: error.details },
          { status: 422 }
        );
      }
      return jsonError(error.message, 400);
    }
    throw error;
  }
}
