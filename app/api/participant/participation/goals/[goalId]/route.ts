import {
  handleParticipantGoalDelete,
  handleParticipantGoalGet,
  handleParticipantGoalPatch,
} from "@/lib/participation/http/route-handlers";

export const dynamic = "force-dynamic";

export const GET = handleParticipantGoalGet;
export const PATCH = handleParticipantGoalPatch;
export const DELETE = handleParticipantGoalDelete;
