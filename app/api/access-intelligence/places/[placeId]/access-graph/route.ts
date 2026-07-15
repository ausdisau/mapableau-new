import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

type Ctx = { params: Promise<{ placeId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { placeId } = await ctx.params;
    const graph = await getAccessIntelligenceRepository().readAccessGraph(placeId);
    return Response.json({ graph });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 404 });
    }
    return Response.json(
      { error: "Could not load access graph.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
