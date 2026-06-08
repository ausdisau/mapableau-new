import { serveAdsQuerySchema } from "@/lib/ads/schemas";
import { serveAds } from "@/lib/ads/serve-service";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = serveAdsQuerySchema.safeParse({
    placement: searchParams.get("placement"),
    pageContext: searchParams.get("pageContext") ?? undefined,
    serviceCategory: searchParams.get("serviceCategory") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    deviceType: searchParams.get("deviceType") ?? undefined,
  });

  if (!parsed.success) return zodErrorResponse(parsed.error);

  const ads = await serveAds(parsed.data);
  return jsonOk({ ads });
}
