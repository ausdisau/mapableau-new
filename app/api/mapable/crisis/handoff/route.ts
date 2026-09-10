import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  normaliseCrisisCommunicationAccess,
  recordCrisisHumanAssistanceRequest,
} from "@/lib/ask-mapable/crisis-handoff";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function parseCommunicationAccess(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return Response.json(
      {
        ok: false,
        error: "Too many requests. Please wait a moment and try again.",
      },
      { status: 429 },
    );
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await request.json().catch(() => ({}));
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId : undefined;
    const communicationAccess = normaliseCrisisCommunicationAccess(
      parseCommunicationAccess(body.communicationAccess),
    );

    const result = await recordCrisisHumanAssistanceRequest({
      userId: user.id,
      participantId: user.id,
      sessionId,
      communicationAccess,
    });

    return Response.json({
      ok: true,
      ...result,
      message: result.recorded
        ? "Your request for MapAble human review was recorded. This does not mean a person or external crisis service has accepted the request yet. If you are in immediate danger, call 000 now."
        : "MapAble could not persist a human-review request in this environment. Use the crisis contacts shown here directly. If you are in immediate danger, call 000 now.",
    });
  } catch (error) {
    console.error("[mapable-crisis-handoff]", error);
    return Response.json(
      {
        ok: false,
        externalAcceptanceConfirmed: false,
        message:
          "MapAble could not record the human-review request. Use the crisis contacts shown here directly. If you are in immediate danger, call 000 now.",
      },
      { status: 500 },
    );
  }
}
