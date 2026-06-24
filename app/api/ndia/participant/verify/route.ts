import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  fetchParticipantPlanSummary,
  verifyParticipantNdisNumber,
} from "@/lib/ndia/participant-api-client";
import { getNdiaHttpConfig } from "@/lib/ndia/shared/config";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => ({}));
  const participantNumber =
    typeof body.participantNumber === "string"
      ? body.participantNumber.trim()
      : "";

  if (!participantNumber) {
    return jsonError("participantNumber required", 400);
  }

  try {
    if (body.action === "plan_summary") {
      const result = await fetchParticipantPlanSummary(participantNumber);
      return jsonOk({ result, enabled: getNdiaHttpConfig().participantApiEnabled });
    }

    const result = await verifyParticipantNdisNumber(participantNumber);
    return jsonOk({ result, enabled: getNdiaHttpConfig().participantApiEnabled });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    if (msg === "NDIA_PARTICIPANT_API_NOT_IMPLEMENTED") {
      return jsonError("NDIA participant API not yet configured", 501);
    }
    if (msg === "NDIA_PLAN_API_NOT_IMPLEMENTED") {
      return jsonError("NDIA plan API not yet configured", 501);
    }
    throw e;
  }
}
