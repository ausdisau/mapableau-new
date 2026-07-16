import { createHash, randomUUID } from "crypto";

export type AuraReplayEventType =
  | "mission.created"
  | "mission.modules_selected"
  | "mission.passport_selected"
  | "capability.lease_issued"
  | "capability.lease_revoked"
  | "evidence.retrieved"
  | "fit.calculated"
  | "route.calculated"
  | "plan.created"
  | "plan.verified"
  | "plan.rejected"
  | "counterfactual.started"
  | "counterfactual.completed"
  | "counterfactual.cancelled"
  | "challenge.completed"
  | "resilience.assessed"
  | "offline_pack.created"
  | "offline_pack.deleted"
  | "mission.stop_requested"
  | "mission.stopped"
  | "mission.human_review_required"
  | "tool.denied"
  | "plan.cancelled";

export type WitnessEvent = {
  id: string;
  missionId: string;
  type: string;
  summary: string;
  correlationId: string;
  createdAt: string;
  payload: Record<string, unknown>;
  /** Wave 2 hash-chain fields */
  sequence: number;
  actorType: "participant" | "system" | "deterministic_engine";
  actorId: string;
  previousHash: string;
  currentHash: string;
  causationId?: string;
  evidenceReferences?: string[];
  policyRuleReferences?: string[];
};

const events: WitnessEvent[] = [];

export function resetWitnessStore(): void {
  events.length = 0;
}

function hashEvent(parts: {
  missionId: string;
  sequence: number;
  type: string;
  summary: string;
  previousHash: string;
  createdAt: string;
}): string {
  return createHash("sha256")
    .update(
      [
        parts.missionId,
        String(parts.sequence),
        parts.type,
        parts.summary,
        parts.previousHash,
        parts.createdAt,
      ].join("|"),
    )
    .digest("hex");
}

function redactPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (
      /passport|diagnosis|health|password|token|chain.of.thought|reasoning/i.test(
        k,
      )
    ) {
      out[k] = "[redacted]";
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function appendWitness(input: {
  missionId: string;
  type: string;
  summary: string;
  correlationId: string;
  payload?: Record<string, unknown>;
  actorType?: WitnessEvent["actorType"];
  actorId?: string;
  causationId?: string;
  evidenceReferences?: string[];
  policyRuleReferences?: string[];
}): WitnessEvent {
  const missionEvents = events.filter((e) => e.missionId === input.missionId);
  const sequence = missionEvents.length + 1;
  const previousHash =
    missionEvents.length === 0
      ? "genesis"
      : missionEvents[missionEvents.length - 1]!.currentHash;
  const createdAt = new Date().toISOString();
  const currentHash = hashEvent({
    missionId: input.missionId,
    sequence,
    type: input.type,
    summary: input.summary,
    previousHash,
    createdAt,
  });

  const event: WitnessEvent = {
    id: randomUUID(),
    missionId: input.missionId,
    type: input.type,
    summary: input.summary,
    correlationId: input.correlationId,
    createdAt,
    payload: redactPayload(input.payload ?? {}),
    sequence,
    actorType: input.actorType ?? "system",
    actorId: input.actorId ?? "aura.witness",
    previousHash,
    currentHash,
    causationId: input.causationId,
    evidenceReferences: input.evidenceReferences,
    policyRuleReferences: input.policyRuleReferences,
  };
  events.push(event);
  return event;
}

export function listWitness(missionId: string): WitnessEvent[] {
  return events
    .filter((e) => e.missionId === missionId)
    .sort((a, b) => a.sequence - b.sequence);
}

export type AuraAuditVerification = {
  missionId: string;
  eventCount: number;
  valid: boolean;
  firstInvalidSequence?: number;
  verifiedAt: string;
  rootHash?: string;
};

export function verifyWitnessChain(missionId: string): AuraAuditVerification {
  const chain = listWitness(missionId);
  let previousHash = "genesis";
  for (const event of chain) {
    if (event.previousHash !== previousHash) {
      return {
        missionId,
        eventCount: chain.length,
        valid: false,
        firstInvalidSequence: event.sequence,
        verifiedAt: new Date().toISOString(),
      };
    }
    const expected = hashEvent({
      missionId: event.missionId,
      sequence: event.sequence,
      type: event.type,
      summary: event.summary,
      previousHash: event.previousHash,
      createdAt: event.createdAt,
    });
    if (expected !== event.currentHash) {
      return {
        missionId,
        eventCount: chain.length,
        valid: false,
        firstInvalidSequence: event.sequence,
        verifiedAt: new Date().toISOString(),
      };
    }
    previousHash = event.currentHash;
  }
  return {
    missionId,
    eventCount: chain.length,
    valid: true,
    verifiedAt: new Date().toISOString(),
    rootHash: chain[chain.length - 1]?.currentHash,
  };
}

/** Test helper — corrupt last hash to simulate tampering. */
export function tamperWitnessLastHash(missionId: string): void {
  const chain = listWitness(missionId);
  const last = chain[chain.length - 1];
  if (!last) return;
  const idx = events.findIndex((e) => e.id === last.id);
  if (idx >= 0) {
    events[idx] = { ...events[idx]!, currentHash: "tampered" };
  }
}

export function buildAuditReplayManifest(missionId: string) {
  const chain = listWitness(missionId);
  const verification = verifyWitnessChain(missionId);
  return {
    id: `manifest-${missionId}`,
    missionId,
    version: 1,
    firstSequence: chain[0]?.sequence ?? 0,
    lastSequence: chain[chain.length - 1]?.sequence ?? 0,
    rootHash: verification.rootHash ?? null,
    eventCount: chain.length,
    verifiedAt: verification.verifiedAt,
    verificationStatus: verification.valid ? "valid" : "invalid",
    events: chain.map((e) => ({
      id: e.id,
      sequence: e.sequence,
      type: e.type,
      summary: e.summary,
      occurredAt: e.createdAt,
      actorType: e.actorType,
      actorId: e.actorId,
      evidenceReferences: e.evidenceReferences ?? [],
      policyRuleReferences: e.policyRuleReferences ?? [],
      previousHash: e.previousHash,
      currentHash: e.currentHash,
      correlationId: e.correlationId,
      // Explicitly no chain-of-thought
      hiddenReasoning: undefined,
    })),
    note: "Structured evidence and decisions only. No hidden chain-of-thought.",
  };
}
