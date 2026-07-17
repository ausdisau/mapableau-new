import type { ControlledPilot, PilotParticipantEnrolment } from "@prisma/client";

export type PilotRuntimeContext = {
  pilot: ControlledPilot;
  enrolment: PilotParticipantEnrolment | null;
  correlationId: string;
  actorUserId: string;
  enforcementEnabled: boolean;
};

export function isPilotEnforcementEnabled(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.PILOT_ENFORCEMENT_ENABLED === "true";
}
