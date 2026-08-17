import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { RunState } from "@openai/agents";

import { NAVIGATOR_CONSENT_PURPOSE } from "@/lib/ai/navigator/consent-gate";
import {
  createGovernedActionEnvelope,
  getGovernedActionEnvelope,
} from "@/lib/ai/navigator/envelopes/service";
import {
  resolveDataEncryptionKey,
  EncryptionKeyUnavailableError,
} from "@/lib/security/encryption-keys";
import { aiPlatformConfig } from "@/lib/config/ai-platform";

import {
  applyRunContextToRunner,
  createMapAbleRunner,
  getDefaultRunConfig,
  recordAgentsSdkRun,
  resolveManagerModel,
} from "./mapable-adapter";
import {
  ALL_AGENTS_SDK_TOOL_NAMES,
  mapAbleAgentRunContextSchema,
  NAVIGATOR_AGENTS_SDK_CAPABILITY,
  type MapAbleAgentRunContext,
} from "./contracts";
import { isAgentsSdkEnabled } from "./config";
import {
  createNavigatorManagerAgent,
  formatManagerInput,
  managerOutputSchema,
  type ManagerAgentOutput,
} from "./manager";
import { defaultEnabledDomainsForPilot, revalidateToolCallContext } from "./policy";

const ALGORITHM = "aes-256-gcm";

export type RunManagerTurnInput = {
  message: string;
  context: MapAbleAgentRunContext;
  /** When resuming from SDK approval pause. */
  serializedRunState?: string;
  /** Opaque envelope id for server-side encrypted state (PR C). */
  approvalEnvelopeId?: string;
  consentStillValid?: boolean;
  silent?: boolean;
};

export type RunManagerTurnResult =
  | {
      status: "completed";
      output: ManagerAgentOutput;
      toolsCalled: string[];
    }
  | {
      status: "interrupted";
      interruptions: unknown[];
      approvalEnvelopeId: string;
      serializedRunState: string;
    }
  | {
      status: "blocked";
      reason: string;
    }
  | {
      status: "deterministic_fallback";
      output: ManagerAgentOutput;
      reason: string;
    };

export function buildDefaultRunContext(
  overrides: Partial<MapAbleAgentRunContext> & {
    tenantId: string;
    participantId: string;
    actorUserId: string;
  },
): MapAbleAgentRunContext {
  return mapAbleAgentRunContextSchema.parse({
    tenantId: overrides.tenantId,
    participantId: overrides.participantId,
    actorUserId: overrides.actorUserId,
    capabilityKey: overrides.capabilityKey ?? NAVIGATOR_AGENTS_SDK_CAPABILITY,
    purpose: overrides.purpose ?? NAVIGATOR_CONSENT_PURPOSE,
    enabledDomains: overrides.enabledDomains ?? defaultEnabledDomainsForPilot(),
    sessionId: overrides.sessionId,
    aiOptedOut: overrides.aiOptedOut ?? false,
    toolAllowlist:
      overrides.toolAllowlist ??
      ([...ALL_AGENTS_SDK_TOOL_NAMES] as string[]),
  });
}

function deterministicFallback(reason: string): ManagerAgentOutput {
  return {
    reply:
      "MapAble cannot run model-assisted Navigator guidance right now. You can continue without AI or ask a human for help.",
    evidenceSummary: "No model-assisted evidence synthesis in this path.",
    interpretationSummary: "Deterministic fallback — model path unavailable.",
    unknowns: [reason],
    participantControlsNote:
      "You remain in control. No booking, payment, or assignment was performed.",
  };
}

export function encryptRunStatePayload(plaintext: string): string {
  const { version, key } = resolveDataEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${version}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptRunStatePayload(payload: string): string | null {
  try {
    const parts = payload.split(":");
    if (parts.length !== 4) return null;
    const [, ivB64, tagB64, dataB64] = parts;
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const { key } = resolveDataEncryptionKey();
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch (err) {
    if (err instanceof EncryptionKeyUnavailableError) throw err;
    return null;
  }
}

/** In-memory store for unit tests when envelope DB is mocked. */
const testRunStateStore = new Map<string, string>();

export function __setTestRunStateStore(
  envelopeId: string,
  serialized: string,
): void {
  testRunStateStore.set(envelopeId, serialized);
}

export function __clearTestRunStateStore(): void {
  testRunStateStore.clear();
}

/**
 * Bounded manager turn — flag-gated, never bypasses Navigator source of truth for Access search.
 */
export async function runManagerTurn(
  input: RunManagerTurnInput,
): Promise<RunManagerTurnResult> {
  const ctx = mapAbleAgentRunContextSchema.parse(input.context);

  if (!isAgentsSdkEnabled()) {
    return { status: "blocked", reason: "feature_flag_disabled" };
  }

  if (aiPlatformConfig.globalKillSwitch) {
    return { status: "blocked", reason: "global_kill_switch" };
  }

  if (ctx.aiOptedOut) {
    return {
      status: "deterministic_fallback",
      output: deterministicFallback("ai_opted_out"),
      reason: "ai_opted_out",
    };
  }

  const model = resolveManagerModel(ctx);
  if (!model.ok) {
    return {
      status: "deterministic_fallback",
      output: deterministicFallback(model.reason ?? "model_unavailable"),
      reason: model.reason ?? "model_unavailable",
    };
  }

  const agent = createNavigatorManagerAgent(ctx);
  const runner = applyRunContextToRunner(createMapAbleRunner(ctx), ctx);
  const runConfig = getDefaultRunConfig(ctx);

  let runResult;

  if (input.approvalEnvelopeId && input.serializedRunState) {
    const revalidation = await revalidateToolCallContext({
      ctx,
      toolName: "propose_draft_summary",
      silent: input.silent,
    });
    if (!revalidation.allowed) {
      return { status: "blocked", reason: revalidation.reason };
    }
    if (input.consentStillValid === false) {
      return { status: "blocked", reason: "consent_invalid" };
    }

    const state = await RunState.fromString(agent, input.serializedRunState);
    runResult = await runner.run(agent, state, {
      context: ctx,
      ...runConfig,
    });
  } else if (input.serializedRunState) {
    const state = await RunState.fromString(agent, input.serializedRunState);
    runResult = await runner.run(agent, state, {
      context: ctx,
      ...runConfig,
    });
  } else {
    runResult = await runner.run(
      agent,
      formatManagerInput(input.message, ctx),
      {
        context: ctx,
        ...runConfig,
      },
    );
  }

  if (runResult.interruptions?.length) {
    let serialized = "";
    try {
      serialized = runResult.state.toString();
    } catch {
      serialized = JSON.stringify(runResult.state);
    }

    const encrypted = encryptRunStatePayload(serialized);
    let envelopeId = input.approvalEnvelopeId ?? "";

    if (!input.silent) {
      try {
        const envelope = await createGovernedActionEnvelope({
          tenantId: ctx.tenantId,
          participantId: ctx.participantId,
          initiatingUserId: ctx.actorUserId,
          capabilityKey: NAVIGATOR_AGENTS_SDK_CAPABILITY,
          action: "agents_sdk_run_pause",
          payload: {
            encryptedRunState: encrypted,
            interruptionCount: runResult.interruptions.length,
            purpose: ctx.purpose,
          },
          evidenceRefs: [],
          sourceRefs: ["agents_sdk.manager"],
          consentReceiptId: "pending",
          requiredApproverRole: "participant",
          lifetimeMinutes: 30,
        });
        envelopeId = envelope.id;
      } catch {
        envelopeId = `local-${Date.now()}`;
        testRunStateStore.set(envelopeId, serialized);
      }
    } else {
      envelopeId = `test-${Date.now()}`;
      testRunStateStore.set(envelopeId, serialized);
    }

    await recordAgentsSdkRun({
      ctx,
      toolsCalled: [],
      status: "interrupted",
    });

    return {
      status: "interrupted",
      interruptions: runResult.interruptions,
      approvalEnvelopeId: envelopeId,
      serializedRunState: serialized,
    };
  }

  const output = managerOutputSchema.parse(runResult.finalOutput);
  await recordAgentsSdkRun({
    ctx,
    toolsCalled: [],
    status: "completed",
    outputSummary: { replyLength: output.reply.length },
  });

  return {
    status: "completed",
    output,
    toolsCalled: [],
  };
}

export async function loadEncryptedRunStateFromEnvelope(input: {
  envelopeId: string;
  tenantId: string;
  participantId: string;
}): Promise<string | null> {
  const fromTest = testRunStateStore.get(input.envelopeId);
  if (fromTest) return fromTest;

  const envelope = await getGovernedActionEnvelope({
    envelopeId: input.envelopeId,
    tenantId: input.tenantId,
    participantId: input.participantId,
  });
  if (!envelope) return null;
  if (envelope.action !== "agents_sdk_run_pause") return null;

  const encrypted = envelope.payload.encryptedRunState;
  if (typeof encrypted !== "string") return null;
  return decryptRunStatePayload(encrypted);
}

export async function resumeManagerTurnFromEnvelope(input: {
  approvalEnvelopeId: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  consentStillValid: boolean;
  approveInterruptions: boolean;
  silent?: boolean;
}): Promise<RunManagerTurnResult> {
  if (!input.approveInterruptions) {
    return { status: "blocked", reason: "approval_rejected" };
  }

  const serialized = await loadEncryptedRunStateFromEnvelope({
    envelopeId: input.approvalEnvelopeId,
    tenantId: input.tenantId,
    participantId: input.participantId,
  });
  if (!serialized) {
    return { status: "blocked", reason: "approval_state_not_found" };
  }

  const ctx = buildDefaultRunContext({
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
  });

  return runManagerTurn({
    message: "",
    context: ctx,
    serializedRunState: serialized,
    approvalEnvelopeId: input.approvalEnvelopeId,
    consentStillValid: input.consentStillValid,
    silent: input.silent,
  });
}

/** Direct Access bridge — calls Navigator orchestrator without model manager loop. */
export async function runAccessProviderSearchViaSdk(input: {
  context: MapAbleAgentRunContext;
  searchInput: Parameters<
    typeof import("@/lib/ai/navigator/orchestrator").runNavigatorProviderSearchTurn
  >[0];
}) {
  if (!isAgentsSdkEnabled()) {
    return { status: "blocked" as const, reason: "feature_flag_disabled" };
  }
  const { runNavigatorProviderSearchTurn } = await import(
    "@/lib/ai/navigator/orchestrator"
  );
  return runNavigatorProviderSearchTurn(input.searchInput);
}
