import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  mapableHomeDisabledResponse,
  mapableHomeFlags,
} from "@/lib/config/mapable-home";
import {
  HomeServiceError,
  getHomeEnvironmentSnapshot,
} from "@/lib/home/service";

export async function GET() {
  if (!mapableHomeFlags.enabled || !mapableHomeFlags.simulatorEnabled) {
    return mapableHomeDisabledResponse("MAPABLE_HOME_ENV_SIMULATOR_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const snapshot = await getHomeEnvironmentSnapshot();
    await createAuditEvent({
      actorUserId: user.id,
      action: "home.environment.read",
      entityType: "HomeEnvironment",
      entityId: snapshot.environment.id,
      participantId: user.id,
      metadata: { simulation: true },
    });
    return jsonOk({
      claimState: "PROPOSED_IN_DEVELOPMENT",
      simulation: true,
      ...snapshot,
    });
  } catch (err) {
    if (err instanceof HomeServiceError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    throw err;
  }
}
