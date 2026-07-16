import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isLifeEventsEnabled } from "@/lib/continuity-os/config";
import {
  ContinuityFeatureDisabledError,
  getLifeEventMissionForParticipant,
} from "@/lib/continuity-os/mission-extension-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isLifeEventsEnabled()) return jsonError("Life events are disabled", 404);

  const { missionId } = await params;
  try {
    const mission = await getLifeEventMissionForParticipant({
      missionId,
      participantId: user.id,
    });
    if (!mission?.lifeEventExtension) {
      return jsonError("Life event mission not found", 404);
    }

    const ext = mission.lifeEventExtension;
    return jsonOk({
      missionId: mission.id,
      status: mission.status,
      desiredOutcome: mission.desiredOutcome,
      typeKey: ext.typeKey,
      typeVersion: ext.typeVersion,
      participantGoal: ext.participantGoal,
      participantWording: ext.participantWording,
      continuityStatus: ext.continuityStatus,
      preferences: ext.preferencesJson,
      unknowns: ext.unknownsJson,
      blockers: ext.blockersJson,
      nonNegotiableRequirements: ext.nonNegotiableRequirementsJson,
      privacyMode: ext.privacyMode,
      templateWarnings: ext.templateWarningsJson,
      prohibitedAutomatedDecisions: ext.prohibitedAutomatedDecisionsJson,
      stoppedAt: ext.stoppedAt,
      events: mission.events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        summary: e.summary,
        severity: e.severity,
        createdAt: e.createdAt,
      })),
    });
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    throw e;
  }
}
