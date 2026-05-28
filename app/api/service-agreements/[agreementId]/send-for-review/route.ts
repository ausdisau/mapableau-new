import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  sendForReview,
  ServiceAgreementLifecycleError,
} from "@/lib/service-agreements/lifecycle-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ agreementId: string }> }
) {
  const user = await requireApiPermission("agreement:manage:org");
  if (user instanceof Response) return user;
  const { agreementId } = await params;
  try {
    const agreement = await sendForReview(agreementId, user.id);
    return jsonOk({ agreement });
  } catch (error) {
    if (error instanceof ServiceAgreementLifecycleError) {
      if (error.code === "NOT_FOUND") return jsonError(error.message, 404);
      return jsonError(error.message, 400);
    }
    throw error;
  }
}
