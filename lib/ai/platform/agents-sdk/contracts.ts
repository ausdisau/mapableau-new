import { z } from "zod";

import { hardConstraintsSchema, rankingWeightsSchema } from "@/lib/ai/navigator/matching/types";

/** Governed specialist domains — only Access may be live in the first slice. */
export const AGENT_SDK_DOMAINS = [
  "access",
  "care",
  "transport",
  "jobs",
  "safeguarding",
  "compliance",
] as const;

export type AgentSdkDomain = (typeof AGENT_SDK_DOMAINS)[number];

export const NAVIGATOR_AGENTS_SDK_CAPABILITY = "navigator.agents_sdk.manager" as const;

export const NAVIGATOR_AGENTS_SDK_FLAG = "MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED" as const;

/** Serializable SDK run context — no secrets, clients, or functions. */
export type MapAbleAgentRunContext = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  capabilityKey: string;
  purpose: string;
  enabledDomains: AgentSdkDomain[];
  sessionId?: string;
  aiOptedOut: boolean;
  /** Intersection with capability registry allowlist at runtime. */
  toolAllowlist: string[];
};

export const mapAbleAgentRunContextSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    actorUserId: z.string().min(1),
    capabilityKey: z.string().min(1),
    purpose: z.string().min(1),
    enabledDomains: z.array(z.enum(AGENT_SDK_DOMAINS)).max(AGENT_SDK_DOMAINS.length),
    sessionId: z.string().min(1).max(120).optional(),
    aiOptedOut: z.boolean(),
    toolAllowlist: z.array(z.string().min(1)).max(50),
  })
  .strict();

export const accessProviderSearchInputSchema = z
  .object({
    goalText: z.string().max(2000).optional(),
    structuredFilters: z
      .object({
        q: z.string().max(500).optional(),
        location: z.string().max(200).optional(),
        service: z.string().max(200).optional(),
        access: z.string().max(200).optional(),
        provider: z.string().max(200).optional(),
        state: z.string().max(10).optional(),
        postcode: z.string().max(12).optional(),
      })
      .strict()
      .optional(),
    hardConstraints: hardConstraintsSchema,
    rankingWeights: rankingWeightsSchema.optional(),
    interpretationConfirmed: z.boolean(),
    saveDraft: z.boolean().optional(),
    transferFilters: z.boolean().optional(),
  })
  .strict();

export type AccessProviderSearchToolInput = z.infer<
  typeof accessProviderSearchInputSchema
>;

export const domainDisabledResultSchema = z.object({
  status: z.literal("domain_disabled"),
  domain: z.enum(AGENT_SDK_DOMAINS),
  message: z.string(),
});

export const draftSummaryInputSchema = z
  .object({
    summaryDraft: z.string().max(4000),
    evidenceLabels: z.array(z.string().max(200)).max(20).default([]),
  })
  .strict();

export type DraftSummaryToolInput = z.infer<typeof draftSummaryInputSchema>;

export const draftSummaryResultSchema = z.object({
  status: z.literal("draft_only"),
  stored: z.literal(false),
  summaryDraft: z.string(),
  note: z.string(),
});

export type SpecialistContractMode =
  | "live"
  | "fail_closed"
  | "draft_human_review"
  | "read_draft_only";

export const SPECIALIST_CONTRACTS: Record<
  AgentSdkDomain,
  { mode: SpecialistContractMode; toolNames: string[] }
> = {
  access: {
    mode: "live",
    toolNames: ["access_provider_search"],
  },
  care: { mode: "fail_closed", toolNames: ["care_consult"] },
  transport: { mode: "fail_closed", toolNames: ["transport_consult"] },
  jobs: { mode: "fail_closed", toolNames: ["jobs_consult"] },
  safeguarding: {
    mode: "draft_human_review",
    toolNames: ["safeguarding_draft_escalation"],
  },
  compliance: { mode: "read_draft_only", toolNames: ["compliance_read_draft"] },
};

export const MANAGER_DRAFT_TOOL = "propose_draft_summary" as const;

export const ALL_AGENTS_SDK_TOOL_NAMES = [
  ...Object.values(SPECIALIST_CONTRACTS).flatMap((c) => c.toolNames),
  MANAGER_DRAFT_TOOL,
] as const;

export type AgentsSdkToolName = (typeof ALL_AGENTS_SDK_TOOL_NAMES)[number];

/** Delimit untrusted participant or retrieved text from agent instructions. */
export function delimitUntrustedData(label: string, content: string): string {
  return [
    `<<<UNTRUSTED_DATA label="${label}">>>`,
    content.slice(0, 8000),
    "<<<END_UNTRUSTED_DATA>>>",
  ].join("\n");
}
