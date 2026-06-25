import { createOrUpdateAccessReport, listPublishedReportsForPlace } from "@/lib/access-reviews/access-report-service";
import { publicReviewerDisplayName } from "@/lib/access-reviews/review-access-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAccessReportSchema } from "@/lib/validation/access-report";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const reports = await listPublishedReportsForPlace(placeId);
  const users = await prisma.user.findMany({
    where: { id: { in: reports.map((r) => r.reviewerProfileId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return jsonOk({
    reports: reports.map((r) => ({
      id: r.id,
      reportType: r.reportType,
      displayName: publicReviewerDisplayName({
        mode: r.displayNameMode,
        userName: userMap.get(r.reviewerProfileId) ?? "Community member",
      }),
      reviewBody: r.reviewBody,
      visitDate: r.visitDate,
      visitedInPerson: r.visitedInPerson,
      submittedAt: r.submittedAt ?? r.createdAt,
      ratings: r.ratings,
      photos: r.photos,
      label: "Community report — user observed conditions",
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createAccessReportSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const report = await createOrUpdateAccessReport({
      placeId,
      reviewerProfileId: user.id,
      reportType: parsed.data.reportType,
      displayNameMode: parsed.data.displayNameMode,
      reviewBody: parsed.data.reviewBody,
      mobilityContext: parsed.data.mobilityContext,
      visitDate: parsed.data.visitDate
        ? new Date(parsed.data.visitDate)
        : undefined,
      visitedInPerson: parsed.data.visitedInPerson,
      measurements: parsed.data.measurements,
      visibility: parsed.data.visibility,
      ratings: parsed.data.ratings,
      publish: parsed.data.publish,
      draftKey: parsed.data.draftKey,
    });

    return jsonOk(
      { report: { id: report.id, status: report.status } },
      parsed.data.publish ? 201 : 200
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "REPORT_RATE_LIMIT") {
      return jsonError("Too many reports submitted recently", 429);
    }
    throw e;
  }
}
