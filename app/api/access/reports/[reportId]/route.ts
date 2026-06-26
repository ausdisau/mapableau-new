import { createOrUpdateAccessReport } from "@/lib/access-reviews/access-report-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { updateAccessReportSchema } from "@/lib/validation/access-report";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { reportId } = await params;
  const existing = await prisma.accessPlaceReview.findUnique({
    where: { id: reportId },
    include: { ratings: true },
  });
  if (!existing) return jsonError("Report not found", 404);
  if (existing.reviewerProfileId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = updateAccessReportSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const report = await createOrUpdateAccessReport({
    placeId: existing.placeId,
    reviewerProfileId: user.id,
    reportId,
    reportType: parsed.data.reportType,
    displayNameMode:
      parsed.data.displayNameMode ?? existing.displayNameMode,
    reviewBody: parsed.data.reviewBody ?? existing.reviewBody,
    mobilityContext: parsed.data.mobilityContext ?? existing.mobilityContext ?? undefined,
    visitDate: parsed.data.visitDate
      ? new Date(parsed.data.visitDate)
      : existing.visitDate ?? undefined,
    visitedInPerson:
      parsed.data.visitedInPerson ?? existing.visitedInPerson,
    measurements: parsed.data.measurements,
    visibility: parsed.data.visibility ?? existing.visibility,
    ratings:
      parsed.data.ratings ??
      existing.ratings.map((r) => ({
        category: r.category,
        value: r.value,
      })),
    publish: parsed.data.publish,
    draftKey: parsed.data.draftKey ?? existing.draftKey ?? undefined,
  });

  return jsonOk({ report: { id: report.id, status: report.status } });
}
