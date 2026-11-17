import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonOk } from "@/lib/api/response";
import { evaluateJourneyAdvice } from "@/lib/transport/maji/journey-advice-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { journeyAdviceEvaluateSchema } from "@/lib/validation/maji-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const { tripId } = await params;
  try {
    const body = journeyAdviceEvaluateSchema.parse(
      await req.json().catch(() => ({}))
    );
    return jsonOk(
      await evaluateJourneyAdvice(user, tripId, {
        preference: body.preference,
        syntheticOrigin: body.syntheticOrigin,
      })
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
