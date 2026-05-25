import { jsonOk } from "@/lib/api/response";
import { searchProviders } from "@/lib/providers/provider-search-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const results = await searchProviders({
    serviceType: searchParams.get("serviceType") ?? undefined,
    postcode: searchParams.get("postcode") ?? undefined,
    suburb: searchParams.get("suburb") ?? undefined,
    radiusKm: searchParams.get("radius")
      ? Number(searchParams.get("radius"))
      : undefined,
    accessCapability: searchParams.get("accessCapability") ?? undefined,
    telehealthAvailable: searchParams.get("telehealth") === "true",
    acceptingNewParticipants:
      searchParams.get("accepting") !== "false",
    verifiedOnly: searchParams.get("verified") === "true",
    lat: searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined,
    lng: searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined,
  });
  return jsonOk({ providers: results });
}
