import { assertRelationalCapability, RELATIONAL_AUDIT } from "@/lib/ai/relational/gates";
import { ndisProviderHardFilter } from "@/lib/ai/navigator/matching/search-tool";
import type { HardConstraintsInput } from "@/lib/ai/navigator/matching/types";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { relationalIntelligenceConfig } from "@/lib/config/relational-intelligence";

export const ACCESS_SEARCH_READ_TOOL = "access_search_read" as const;

export type AccessSearchReadInput = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  constraints: HardConstraintsInput;
  q?: string;
  limit?: number;
  silent?: boolean;
  now?: Date;
};

export type AccessSearchReadResult = {
  count: number;
  /** Candidate ids only — full records via Navigator matching path. */
  candidateIds: string[];
  noSafeMatchHint: boolean;
};

/**
 * Governed read-only access search tool (`access.search.read`).
 * Delegates to ndis_provider_hard_filter under Navigator matching when enabled.
 */
export async function accessSearchRead(
  input: AccessSearchReadInput,
): Promise<AccessSearchReadResult> {
  if (!relationalIntelligenceConfig.accessSearchEnabled) {
    throw new Error("RELATIONAL_ACCESS_SEARCH_DISABLED");
  }

  const gate = await assertRelationalCapability({
    capabilityKey: "access.search.read",
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    toolName: ACCESS_SEARCH_READ_TOOL,
    silent: input.silent,
  });
  if (!gate.allowed) {
    throw new Error(`RELATIONAL_GATE_DENIED:${gate.reason}`);
  }

  const search = await ndisProviderHardFilter({
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    constraints: input.constraints,
    q: input.q,
    limit: input.limit,
    silent: input.silent,
    now: input.now,
  });

  if (!input.silent) {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: input.participantId,
      action: RELATIONAL_AUDIT.accessSearchRead,
      entityType: "AccessSearch",
      entityId: input.tenantId,
      metadata: {
        count: search.count,
        q: input.q ?? null,
      },
    });
  }

  return {
    count: search.count,
    candidateIds: search.candidates.map((c) => c.id),
    noSafeMatchHint: search.count === 0,
  };
}
