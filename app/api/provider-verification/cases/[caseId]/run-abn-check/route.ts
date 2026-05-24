import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { userCanAccessVerificationCase } from "@/lib/api/verification-scope";
import { isAdminRole } from "@/lib/auth/roles";
import { runAbnCheckForCase } from "@/lib/provider-verification/abn-check-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  let user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isAdminRole(user.primaryRole)) {
    const permitted = await requireApiPermission("verification:manage:org");
    if (permitted instanceof Response) return permitted;
    user = permitted;
  }

  const { caseId } = await params;
  if (!(await userCanAccessVerificationCase(user, caseId))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const result = await runAbnCheckForCase(caseId, user.id);
    return jsonOk({ result });
  } catch (e) {
    if (e instanceof Error && e.message === "VERIFICATION_DISABLED") {
      return jsonError("Provider verification is disabled", 503);
    }
    if (e instanceof Error && e.message === "CASE_NOT_FOUND") {
      return jsonError("Case not found", 404);
    }
    throw e;
  }
}
