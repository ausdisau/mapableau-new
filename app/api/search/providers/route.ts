import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { searchCareProviders } from "@/lib/search/provider-search-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("search:providers");
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const results = await searchCareProviders({
    serviceRegion: searchParams.get("region") ?? undefined,
    verificationStatus: searchParams.get("verification") ?? undefined,
  });

  if (results.length === 0 && searchParams.get("recordUnmet") === "true") {
    try {
      const { createUnmetNeed } = await import("@/lib/unmet-needs/unmet-need-service");
      await createUnmetNeed({
        participantId: user.id,
        needType: "no_provider_found",
        description: "No providers matched search filters.",
        suburb: searchParams.get("region") ?? undefined,
        searchContext: {
          region: searchParams.get("region"),
          verification: searchParams.get("verification"),
        },
        createdById: user.id,
      });
    } catch {
      // Module disabled or not applicable
    }
  }

  return jsonOk({ results });
}
