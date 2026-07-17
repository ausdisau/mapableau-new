export type DutyConflict = {
  conflict: boolean;
  reason: string;
};

/** Claim preparer cannot be the same actor as claim approver. */
export function checkClaimSeparationOfDuties(params: {
  preparerUserId: string;
  approverUserId: string;
}): DutyConflict {
  if (params.preparerUserId === params.approverUserId) {
    return {
      conflict: true,
      reason: "preparer_cannot_approve_own_claim",
    };
  }
  return { conflict: false, reason: "duties_separated" };
}

/** Go-live assessor should differ from pilot activator when both set. */
export function checkGoLiveSeparationOfDuties(params: {
  assessedById?: string | null;
  activatedById?: string | null;
}): DutyConflict {
  if (
    params.assessedById &&
    params.activatedById &&
    params.assessedById === params.activatedById
  ) {
    return {
      conflict: true,
      reason: "assessor_should_not_activate_same_pilot",
    };
  }
  return { conflict: false, reason: "duties_separated_or_not_applicable" };
}
