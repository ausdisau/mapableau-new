import { randomUUID } from "crypto";

import type { AuraAuthorityLevel } from "../authority/ladder";
import { AURA_WAVE1_AUTHORITY_CEILING } from "../authority/ladder";
import type {
  AuraCapabilityId,
  AuraCapabilityLease,
  AuraModule,
} from "../schemas";

const DEFAULT_TTL_MS = 60 * 60 * 1000;

/** Module → capabilities mapping for Wave 1. */
export const MODULE_CAPABILITIES: Record<
  AuraModule,
  Array<{
    capabilityId: AuraCapabilityId;
    authority: AuraCapabilityLease["authority"];
    authorityLevel: AuraAuthorityLevel;
    fieldScope: string[];
  }>
> = {
  core_calendar: [
    {
      capabilityId: "calendar.read_appointments",
      authority: "read",
      authorityLevel: "L0_OBSERVE",
      fieldScope: ["appointments", "conflicts"],
    },
  ],
  care: [
    {
      capabilityId: "care.read_summary",
      authority: "read",
      authorityLevel: "L0_OBSERVE",
      fieldScope: ["requests", "timing"],
    },
  ],
  transport: [
    {
      capabilityId: "transport.read_options",
      authority: "read",
      authorityLevel: "L0_OBSERVE",
      fieldScope: ["trips", "requests", "options"],
    },
  ],
  jobs: [
    {
      capabilityId: "jobs.read_interview_context",
      authority: "read",
      authorityLevel: "L0_OBSERVE",
      fieldScope: ["interview", "workplace_access"],
    },
  ],
  access: [
    {
      capabilityId: "access.read_place_evidence",
      authority: "read",
      authorityLevel: "L0_OBSERVE",
      fieldScope: ["features", "evidence", "incidents"],
    },
    {
      capabilityId: "access.calculate_fit",
      authority: "recommend",
      authorityLevel: "L2_RECOMMEND",
      fieldScope: ["fit"],
    },
    {
      capabilityId: "access.build_route",
      authority: "recommend",
      authorityLevel: "L2_RECOMMEND",
      fieldScope: ["route"],
    },
    {
      capabilityId: "access.counterfactuals",
      authority: "recommend",
      authorityLevel: "L2_RECOMMEND",
      fieldScope: ["counterfactual"],
    },
  ],
  billing_summaries: [],
  accessibility_profile: [],
  access_passport: [
    {
      capabilityId: "access.read_passport",
      authority: "read",
      authorityLevel: "L0_OBSERVE",
      fieldScope: ["requirements"],
    },
  ],
  supporter_context: [],
};

export type LeaseStore = {
  leases: Map<string, AuraCapabilityLease>;
};

const globalLeaseStore: LeaseStore = { leases: new Map() };

export function getLeaseStore(): LeaseStore {
  return globalLeaseStore;
}

export function resetLeaseStore(): void {
  globalLeaseStore.leases.clear();
}

export function issueLeases(input: {
  missionId: string;
  userId: string;
  modules: AuraModule[];
  resourceScope: string[];
  correlationId: string;
  ttlMs?: number;
}): AuraCapabilityLease[] {
  const now = Date.now();
  const expiresAt = new Date(
    now + (input.ttlMs ?? DEFAULT_TTL_MS),
  ).toISOString();
  const issued: AuraCapabilityLease[] = [];

  const always: Array<{
    capabilityId: AuraCapabilityId;
    authority: AuraCapabilityLease["authority"];
    authorityLevel: AuraAuthorityLevel;
    module: AuraModule;
    fieldScope: string[];
  }> = [
    {
      capabilityId: "mission.read",
      authority: "read",
      authorityLevel: "L0_OBSERVE",
      module: "core_calendar",
      fieldScope: ["mission"],
    },
    {
      capabilityId: "mission.stop",
      authority: "read",
      authorityLevel: "L0_OBSERVE",
      module: "core_calendar",
      fieldScope: ["stop"],
    },
    {
      capabilityId: "plan.build_proof",
      authority: "recommend",
      authorityLevel: "L2_RECOMMEND",
      module: "access",
      fieldScope: ["plan"],
    },
    {
      capabilityId: "plan.verify",
      authority: "recommend",
      authorityLevel: "L2_RECOMMEND",
      module: "access",
      fieldScope: ["verifier"],
    },
    {
      capabilityId: "plan.challenge",
      authority: "recommend",
      authorityLevel: "L2_RECOMMEND",
      module: "access",
      fieldScope: ["challenge"],
    },
  ];

  for (const item of always) {
    if (
      item.capabilityId.startsWith("plan.") &&
      !input.modules.includes("access")
    ) {
      continue;
    }
    const lease: AuraCapabilityLease = {
      id: randomUUID(),
      missionId: input.missionId,
      userId: input.userId,
      module: item.module,
      capabilityId: item.capabilityId,
      authority: item.authority,
      authorityLevel: item.authorityLevel,
      resourceScope: input.resourceScope,
      fieldScope: item.fieldScope,
      issuedAt: new Date(now).toISOString(),
      expiresAt,
      revokedAt: null,
      revocationReason: null,
      correlationId: input.correlationId,
    };
    globalLeaseStore.leases.set(lease.id, lease);
    issued.push(lease);
  }

  for (const mod of input.modules) {
    for (const cap of MODULE_CAPABILITIES[mod] ?? []) {
      if (cap.authority === "propose") continue; // Wave 1: no propose leases
      const lease: AuraCapabilityLease = {
        id: randomUUID(),
        missionId: input.missionId,
        userId: input.userId,
        module: mod,
        capabilityId: cap.capabilityId,
        authority: cap.authority,
        authorityLevel: cap.authorityLevel,
        resourceScope: input.resourceScope,
        fieldScope: cap.fieldScope,
        issuedAt: new Date(now).toISOString(),
        expiresAt,
        revokedAt: null,
        revocationReason: null,
        correlationId: input.correlationId,
      };
      globalLeaseStore.leases.set(lease.id, lease);
      issued.push(lease);
    }
  }

  return issued;
}

export function listActiveLeases(missionId: string): AuraCapabilityLease[] {
  const now = Date.now();
  return [...globalLeaseStore.leases.values()].filter((l) => {
    if (l.missionId !== missionId) return false;
    if (l.revokedAt) return false;
    if (Date.parse(l.expiresAt) <= now) return false;
    return true;
  });
}

export function hasActiveLease(
  missionId: string,
  capabilityId: AuraCapabilityId,
): boolean {
  return listActiveLeases(missionId).some(
    (l) => l.capabilityId === capabilityId,
  );
}

export function assertLease(
  missionId: string,
  capabilityId: AuraCapabilityId,
): AuraCapabilityLease {
  const lease = listActiveLeases(missionId).find(
    (l) => l.capabilityId === capabilityId,
  );
  if (!lease) {
    throw new Error(`AURA_LEASE_DENIED:${capabilityId}`);
  }
  return lease;
}

export function revokeAllLeases(
  missionId: string,
  reason: string,
): AuraCapabilityLease[] {
  const revoked: AuraCapabilityLease[] = [];
  const now = new Date().toISOString();
  for (const lease of globalLeaseStore.leases.values()) {
    if (lease.missionId !== missionId || lease.revokedAt) continue;
    const next = {
      ...lease,
      revokedAt: now,
      revocationReason: reason,
    };
    globalLeaseStore.leases.set(lease.id, next);
    revoked.push(next);
  }
  return revoked;
}

export function isLeaseExpiredOrRevoked(lease: AuraCapabilityLease): boolean {
  if (lease.revokedAt) return true;
  return Date.parse(lease.expiresAt) <= Date.now();
}

export { AURA_WAVE1_AUTHORITY_CEILING };
