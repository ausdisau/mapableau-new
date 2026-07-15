import {
  AccessIntelligenceError,
  isAccessIntelligenceError,
} from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

type Ctx = { params: Promise<{ placeId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { placeId } = await ctx.params;
    const place = await getAccessIntelligenceRepository().getPlace(placeId);
    return Response.json({ place });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 404 });
    }
    return Response.json(
      new AccessIntelligenceError(
        "REPOSITORY_UNAVAILABLE",
        "Could not load place.",
        "Try again shortly.",
      ).toPublicJson(),
      { status: 503 },
    );
  }
}
