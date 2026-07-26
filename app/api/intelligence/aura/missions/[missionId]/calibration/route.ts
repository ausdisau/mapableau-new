import { jsonError, jsonOk } from "@/lib/api/response";
import {
  comparePredictedVsObserved,
  getCalibrationComparison,
  getOutcomeForMission,
} from "@/lib/aura/calibration";
import { requireMission } from "@/lib/aura/mission/store";
import type { CurrentUser } from "@/lib/auth/current-user";
import { withAuthorization } from "@/lib/auth/withAuthorization";

export const runtime = "nodejs";

type MissionCtx = { params: Promise<{ missionId: string }> };

export const GET = withAuthorization(
  {},
  async (_req, ctx: MissionCtx, user: CurrentUser) => {
    const { missionId } = await ctx.params;
    try {
      const mission = requireMission(missionId);
      if (mission.participantId !== user.id) {
        return jsonError("Forbidden", 403);
      }
      const outcome = getOutcomeForMission(missionId);
      if (!outcome) {
        return jsonError("AURA_OUTCOME_NOT_FOUND", 404);
      }
      const comparison = getCalibrationComparison(missionId, outcome.id);
      return jsonOk({ comparison });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AURA_ERROR";
      if (message === "AURA_MISSION_NOT_FOUND") {
        return jsonError(message, 404);
      }
      return jsonError(message, 400);
    }
  },
);

export const POST = withAuthorization(
  { requireMfa: true },
  async (_req, ctx: MissionCtx, user: CurrentUser) => {
    const { missionId } = await ctx.params;
    try {
      const mission = requireMission(missionId);
      if (mission.participantId !== user.id) {
        return jsonError("Forbidden", 403);
      }
      const outcome = getOutcomeForMission(missionId);
      if (!outcome) {
        return jsonError("AURA_OUTCOME_NOT_FOUND", 404);
      }
      const comparison = comparePredictedVsObserved(mission, outcome);
      return jsonOk({ comparison });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AURA_ERROR";
      if (message === "MAPABLE_AURA_OUTCOME_CALIBRATION_DISABLED") {
        return jsonError("Outcome calibration is not enabled", 503);
      }
      return jsonError(message, 400);
    }
  },
);
