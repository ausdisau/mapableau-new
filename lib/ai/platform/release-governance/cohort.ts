/**
 * Server-side pilot cohort controls (Prompt 12).
 * Auditable, revocable, tenant-aware, capability-specific.
 * Do NOT use client-only feature gates for cohort membership.
 */

import { isReleaseGovernanceEnabled } from "@/lib/config/release-governance";

import { isPilotEligibleState } from "./states";
import type {
  CohortAccessDecision,
  MapAbleReleaseManifest,
  PilotCohortMembership,
} from "./types";

type CohortStore = {
  memberships: PilotCohortMembership[];
};

const globalStore: CohortStore = {
  memberships: [],
};

function store(): CohortStore {
  return globalStore;
}

export function resetPilotCohortStore(): void {
  store().memberships = [];
}

export function listPilotCohortMemberships(
  filter?: Partial<{
    cohortId: string;
    tenantId: string;
    participantId: string;
    capabilityKey: string;
    includeRevoked: boolean;
  }>
): PilotCohortMembership[] {
  return store().memberships.filter((m) => {
    if (filter?.cohortId && m.cohortId !== filter.cohortId) return false;
    if (filter?.tenantId && m.tenantId !== filter.tenantId) return false;
    if (filter?.participantId && m.participantId !== filter.participantId) {
      return false;
    }
    if (filter?.capabilityKey && m.capabilityKey !== filter.capabilityKey) {
      return false;
    }
    if (!filter?.includeRevoked && m.revokedAt) return false;
    return true;
  });
}

export function grantPilotCohortMembership(input: {
  cohortId: string;
  tenantId: string;
  participantId: string;
  capabilityKey: string;
  grantedBy: string;
  auditNote: string;
  now?: Date;
}): PilotCohortMembership {
  if (!isReleaseGovernanceEnabled()) {
    throw new Error("RELEASE_GOVERNANCE_DISABLED");
  }
  const now = (input.now ?? new Date()).toISOString();
  for (const existing of store().memberships) {
    if (
      existing.tenantId === input.tenantId &&
      existing.participantId === input.participantId &&
      existing.capabilityKey === input.capabilityKey &&
      existing.revokedAt === null
    ) {
      existing.revokedAt = now;
      existing.revokedBy = input.grantedBy;
    }
  }
  const membership: PilotCohortMembership = {
    cohortId: input.cohortId,
    tenantId: input.tenantId,
    participantId: input.participantId,
    capabilityKey: input.capabilityKey,
    grantedAt: now,
    grantedBy: input.grantedBy,
    revokedAt: null,
    revokedBy: null,
    auditNote: input.auditNote,
  };
  store().memberships.push(membership);
  return membership;
}

export function revokePilotCohortMembership(input: {
  tenantId: string;
  participantId: string;
  capabilityKey: string;
  revokedBy: string;
  now?: Date;
}): PilotCohortMembership | null {
  if (!isReleaseGovernanceEnabled()) {
    throw new Error("RELEASE_GOVERNANCE_DISABLED");
  }
  const now = (input.now ?? new Date()).toISOString();
  const active = store().memberships.find(
    (m) =>
      m.tenantId === input.tenantId &&
      m.participantId === input.participantId &&
      m.capabilityKey === input.capabilityKey &&
      m.revokedAt === null
  );
  if (!active) return null;
  active.revokedAt = now;
  active.revokedBy = input.revokedBy;
  return active;
}

/**
 * Server-side cohort + flag enforcement for a future authorised pilot.
 * Fail-closed when governance is off, flags are off, state is wrong, or
 * membership is missing/revoked.
 */
export function assertCohortAccess(input: {
  manifest: MapAbleReleaseManifest;
  tenantId: string;
  participantId: string;
  /** Server-resolved flag map — never trust client-supplied flags. */
  serverFlags: Record<string, boolean>;
}): CohortAccessDecision {
  if (!isReleaseGovernanceEnabled()) {
    return {
      allowed: false,
      reason: "release_governance_disabled",
      membership: null,
    };
  }

  if (!isPilotEligibleState(input.manifest.releaseState)) {
    return {
      allowed: false,
      reason: `release_state_not_pilot_eligible:${input.manifest.releaseState}`,
      membership: null,
    };
  }

  // Candidate is a planning state — participants are not enabled yet.
  if (input.manifest.releaseState === "controlled_pilot_candidate") {
    return {
      allowed: false,
      reason: "candidate_not_enabled_for_participants",
      membership: null,
    };
  }

  for (const flag of input.manifest.requiredFlags) {
    if (input.serverFlags[flag] !== true) {
      return {
        allowed: false,
        reason: `required_flag_off:${flag}`,
        membership: null,
      };
    }
  }

  if (input.manifest.allowedCohorts.length === 0) {
    return {
      allowed: false,
      reason: "no_allowed_cohorts_configured",
      membership: null,
    };
  }

  const membership = store().memberships.find(
    (m) =>
      m.tenantId === input.tenantId &&
      m.participantId === input.participantId &&
      m.capabilityKey === input.manifest.capabilityKey &&
      m.revokedAt === null &&
      input.manifest.allowedCohorts.includes(m.cohortId)
  );

  if (!membership) {
    return {
      allowed: false,
      reason: "not_in_allowed_cohort",
      membership: null,
    };
  }

  return {
    allowed: true,
    reason: "cohort_membership_active",
    membership,
  };
}
