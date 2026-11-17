import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonOk } from "@/lib/api/response";
import { recordJourneyAdviceDecision } from "@/lib/transport/maji/journey-advice-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { journeyAdviceDecisionSchema } from "@/lib/validation/maji-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string; adviceId: string }> }
) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const { tripId, adviceId } = await params;
  try {
    const body = journeyAdviceDecisionSchema.parse(await req.json());
    return jsonOk(
      await recordJourneyAdviceDecision(user, tripId, adviceId, body.decision)
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
