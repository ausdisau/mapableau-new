import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { decideVerificationCaseSchema } from "@/lib/validation/verification";
import { decideVerificationCase } from "@/lib/provider-verification/verification-case-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await requireApiPermission("verification:manage:any");
  if (user instanceof Response) return user;

  const { caseId } = await params;
  const body = await req.json();
  const parsed = decideVerificationCaseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  try {
    const updated = await decideVerificationCase({
      caseId,
      adminUserId: user.id,
      outcome: parsed.data.outcome,
      conditions: parsed.data.conditions,
      reason: parsed.data.reason,
    });
    return jsonOk({ case: updated });
  } catch (e) {
    if (e instanceof Error && e.message === "VERIFICATION_DISABLED") {
      return jsonError("Provider verification is disabled", 503);
    }
    throw e;
  }
}
