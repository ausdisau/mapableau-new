import { updateAccessReportSchema } from "@/lib/validation/access-report";
import { updateAccessReport } from "@/lib/access-reports/access-report-service";
import { isAccessModerator } from "@/lib/access-community/access-role-policy";
import { reviewToAccessReport } from "@/types/access-report";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { reportId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = updateAccessReportSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const report = await updateAccessReport({
      reportId,
      userId: user.id,
      input: parsed.data,
      isModerator: await isAccessModerator(user),
    });
    return jsonOk({ report: reviewToAccessReport(report) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "REPORT_NOT_FOUND") return jsonError("Report not found", 404);
    if (msg === "REPORT_FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "REPORT_ALREADY_PUBLISHED") {
      return jsonError("Report already published", 409);
    }
    throw e;
  }
}
