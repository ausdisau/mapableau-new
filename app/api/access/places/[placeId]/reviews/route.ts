import { createAccessReviewSchema } from "@/lib/validation/access-review";
import { createAccessReview, listPublishedReviewsForPlace } from "@/lib/access-reviews/access-review-service";
import { publicReviewerDisplayName } from "@/lib/access-reviews/review-access-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const reviews = await listPublishedReviewsForPlace(placeId);
  const users = await prisma.user.findMany({
    where: { id: { in: reviews.map((r) => r.reviewerProfileId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return jsonOk({
    reviews: reviews.map((r) => ({
      id: r.id,
      displayName: publicReviewerDisplayName({
        mode: r.displayNameMode,
        userName: userMap.get(r.reviewerProfileId) ?? "Community member",
      }),
      reviewBody: r.reviewBody,
      mobilityContext: r.mobilityContext,
      visitDate: r.visitDate,
      createdAt: r.createdAt,
      ratings: r.ratings,
      label: "Community review — user reported",
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
  const body = await req.json();
  const parsed = createAccessReviewSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const review = await createAccessReview({
    placeId,
    reviewerProfileId: user.id,
    displayNameMode: parsed.data.displayNameMode,
    reviewBody: parsed.data.reviewBody,
    mobilityContext: parsed.data.mobilityContext,
    visitDate: parsed.data.visitDate ? new Date(parsed.data.visitDate) : undefined,
    visibility: parsed.data.visibility,
    ratings: parsed.data.ratings,
    publish: parsed.data.publish,
  });

  return jsonOk({ review: { id: review.id, status: review.status } }, 201);
}
