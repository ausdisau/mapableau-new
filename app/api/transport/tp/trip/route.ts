import { requirePtReadAccess } from "@/lib/public-transport/require-pt-read";
import { jsonOk } from "@/lib/api/response";
import { planTrip, planTripFromCoordinates } from "@/lib/tfnsw/trip-planner-service";
import { parseTfnswTripPlan } from "@/lib/tfnsw/trip-planner-parse";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { tpTripPlanSchema } from "@/lib/validation/tfnsw-schemas";

export async function GET(req: Request) {
  const user = await requirePtReadAccess();
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = tpTripPlanSchema.parse({
      originStopId: url.searchParams.get("originStopId") ?? undefined,
      destinationStopId: url.searchParams.get("destinationStopId") ?? undefined,
      origin:
        url.searchParams.get("originLat") && url.searchParams.get("originLng")
          ? {
              lat: Number(url.searchParams.get("originLat")),
              lng: Number(url.searchParams.get("originLng")),
            }
          : url.searchParams.get("origin")
            ? JSON.parse(url.searchParams.get("origin")!)
            : undefined,
      destination:
        url.searchParams.get("destinationLat") && url.searchParams.get("destinationLng")
          ? {
              lat: Number(url.searchParams.get("destinationLat")),
              lng: Number(url.searchParams.get("destinationLng")),
            }
          : url.searchParams.get("destination")
            ? JSON.parse(url.searchParams.get("destination")!)
            : undefined,
      depArrMacro: url.searchParams.get("depArrMacro") ?? undefined,
      itdDate: url.searchParams.get("itdDate") ?? undefined,
      itdTime: url.searchParams.get("itdTime") ?? undefined,
      maxTrips: url.searchParams.get("maxTrips")
        ? Number(url.searchParams.get("maxTrips"))
        : undefined,
      wheelchair:
        url.searchParams.get("wheelchair") === "true" ||
        url.searchParams.get("wheelchair") === "1"
          ? true
          : url.searchParams.get("wheelchair") === "false"
            ? false
            : undefined,
    });

    let raw: unknown;
    if (params.origin && params.destination) {
      raw = await planTripFromCoordinates({
        origin: params.origin,
        destination: params.destination,
        depArrMacro: params.depArrMacro,
        itdDate: params.itdDate,
        itdTime: params.itdTime,
        maxTrips: params.maxTrips,
        wheelchair: params.wheelchair,
      });
    } else {
      raw = await planTrip({
        typeOrigin: "any",
        nameOrigin: params.originStopId!,
        typeDestination: "any",
        nameDestination: params.destinationStopId!,
        depArrMacro: params.depArrMacro,
        itdDate: params.itdDate,
        itdTime: params.itdTime,
        maxTrips: params.maxTrips,
        wheelchair: params.wheelchair,
      });
    }

    const plan = parseTfnswTripPlan(raw);
    return jsonOk({ plan, raw });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
