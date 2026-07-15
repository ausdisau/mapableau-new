import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { stripReviewPii } from "@/lib/ai/privacy";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  placeId: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  verifiedSinceDays: z.coerce.number().min(1).max(365).optional(),
});

/** Published reviews as comments (display names redacted / anonymised). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const since =
    parsed.data.verifiedSinceDays != null
      ? new Date(
          Date.now() -
            parsed.data.verifiedSinceDays * 24 * 60 * 60 * 1000,
        )
      : undefined;

  const reviews = await prisma.accessPlaceReview.findMany({
    where: {
      status: "published",
      ...(parsed.data.placeId ? { placeId: parsed.data.placeId } : {}),
      ...(since
        ? {
            OR: [
              { visitDate: { gte: since } },
              { createdAt: { gte: since } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: parsed.data.limit,
    select: {
      id: true,
      placeId: true,
      reviewBody: true,
      visitDate: true,
      createdAt: true,
      displayNameMode: true,
      mobilityContext: true,
      place: { select: { name: true, suburb: true } },
    },
  });

  return jsonOk({
    comments: reviews.map((r) => ({
      id: r.id,
      placeId: r.placeId,
      placeName: r.place.name,
      suburb: r.place.suburb,
      body: stripReviewPii(r.reviewBody),
      visitDate: r.visitDate?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      displayName:
        r.displayNameMode === "anonymous_public"
          ? "Community member"
          : "Community reviewer",
      mobilityContext: r.mobilityContext,
    })),
  });
}
