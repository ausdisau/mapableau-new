import type { CurrentUser } from "@/lib/auth/current-user";
import { canViewParticipantProfile } from "@/lib/auth/permissions";
import { isDemoParticipantId } from "@/lib/participant-needs/resolve-participant-user";

export class ParticipantAccessError extends Error {
  constructor(message = "You do not have access to this participant record.") {
    super(message);
    this.name = "ParticipantAccessError";
  }
}

/**
 * participantId may be PRMS demo id or authenticated User.id.
 */
export function assertParticipantAccess(
  actor: CurrentUser,
  participantId: string,
): void {
  if (isDemoParticipantId(participantId)) {
    return;
  }

  if (actor.id === participantId) {
    return;
  }

  if (
    canViewParticipantProfile(actor.primaryRole, actor.id, participantId)
  ) {
    return;
  }

  throw new ParticipantAccessError();
}
