import { createAccessReportSchema } from "@/lib/validation/access-report";
import {
  createAccessReport,
  getDraftReportForUser,
  listReportsFeed,
} from "@/lib/access-reports/access-report-service";
import { reviewToAccessReport } from "@/types/access-report";
import { publicReviewerDisplayName } from "@/lib/access-reviews/review-access-policy";
import { getVerificationCounts } from "@/lib/access-verification/verification-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const url = new URL(req.url);
  const feed = url.searchParams.get("feed") === "true";

  if (feed) {
    const reports = await listReportsFeed(placeId);
    const users = await prisma.user.findMany({
      where: { id: { in: reports.map((r) => r.reviewerProfileId) } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const enriched = await Promise.all(
      reports.map(async (r) => {
        const verifications = await getVerificationCounts(
          "AccessPlaceReview",
          r.id
        );
        return {
          ...reviewToAccessReport(r),
          displayName: publicReviewerDisplayName({
            mode: r.displayNameMode,
            userName: userMap.get(r.reviewerProfileId) ?? "Community member",
          }),
          verifications,
        };
      })
    );

    return jsonOk({ reports: enriched });
  }

  const user = await requireApiSession();
  if (user instanceof Response) {
    return jsonOk({ draft: null });
  }

  const draft = await getDraftReportForUser(placeId, user.id);
  return jsonOk({
    draft: draft ? reviewToAccessReport(draft) : null,
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
    const report = await createAccessReport({
      placeId,
      reviewerProfileId: user.id,
      input: parsed.data,
    });
    return jsonOk(
      { report: reviewToAccessReport(report) },
      parsed.data.publish ? 201 : 200
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "REPORT_RATE_LIMIT") {
      return jsonError("Too many reports submitted recently", 429);
    }
    if (msg === "REPORT_ALREADY_PUBLISHED") {
      return jsonError(
        "You already have a published report for this place",
        409
      );
    }
    throw e;
  }
}
