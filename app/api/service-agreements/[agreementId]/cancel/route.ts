import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  cancelAgreement,
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
    const agreement = await cancelAgreement({
      agreementId,
      actorUserId: user.id,
      reason: body.reason,
    });
    return jsonOk({ agreement });
  } catch (error) {
    if (error instanceof ServiceAgreementLifecycleError) {
      if (error.code === "NOT_FOUND") return jsonError(error.message, 404);
      return jsonError(error.message, 400);
    }
    throw error;
  }
}
