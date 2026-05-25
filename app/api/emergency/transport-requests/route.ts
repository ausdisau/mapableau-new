import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requestEmergencyTransport } from "@/lib/emergency/transport-escalation-service";
import { emergencyTransportSchema } from "@/lib/validation/emergency";

export async function POST(req: Request) {
  const user = await requireApiPermission("emergency:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = emergencyTransportSchema.parse(await req.json());
    const result = await requestEmergencyTransport({
      participantId: user.id,
      actorUserId: user.id,
      ...parsed,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Transport request failed", 500);
  }
}
