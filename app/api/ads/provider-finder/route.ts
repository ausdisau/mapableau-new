import { cookies } from "next/headers";

import {
  AD_SESSION_COOKIE,
  getOrCreateAdSessionToken,
  parseCsvParam,
  parseViewportFromSearchParams,
} from "@/lib/ads/ad-request-utils";
import { OSM_ATTRIBUTION_NOTE, selectAdsForContext } from "@/lib/ads/ad-selection-service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { adProviderFinderQuerySchema } from "@/types/ads";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const cookieStore = await cookies();
  const sessionToken = getOrCreateAdSessionToken(
    cookieStore.get(AD_SESSION_COOKIE)?.value,
  );

  const parsed = adProviderFinderQuerySchema.safeParse({
    surface: "provider_finder",
    serviceCategories: parseCsvParam(params.get("categories")),
    suburb: params.get("suburb") ?? undefined,
    postcode: params.get("postcode") ?? undefined,
    state: params.get("state") ?? undefined,
    accessFeatureTerms: parseCsvParam(params.get("access")),
    providerFinderQuery: params.get("q") ?? undefined,
    viewport: parseViewportFromSearchParams(params),
    sessionToken,
  });

  if (!parsed.success) {
    return jsonError("Invalid provider finder ad query", 400);
  }

  const ads = await selectAdsForContext(parsed.data, 3);

  const response = jsonOk({
    ads,
    attributionNote: OSM_ATTRIBUTION_NOTE,
  });

  response.headers.set(
    "Set-Cookie",
    `${AD_SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
  );
  response.headers.set("Cache-Control", "private, no-store");

  return response;
}
