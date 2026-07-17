import { z } from "zod";

import { REPLAY_EVENT_NAMESPACE, REPLAY_EVENT_TYPES } from "./types";
import { parseYamlLite } from "./yaml-lite";

export const replayProductModeSchema = z.enum([
  "engineering_regression",
  "provider_exercise",
  "academy_simulation",
  "participant_codesign",
  "partner_conformance",
  "policy_civic",
]);

export const replayActorRoleSchema = z.enum([
  "participant",
  "supporter",
  "worker",
  "provider_coordinator",
  "driver",
  "transport_operator",
  "employer",
  "venue",
  "equipment_supplier",
  "navigator",
  "plan_manager",
  "council",
  "api_partner",
  "aura",
  "application_service",
]);

export const replayEventTypeSchema = z.enum(
  REPLAY_EVENT_TYPES as unknown as [string, ...string[]],
);

const timelineEventSchema = z.string().superRefine((val, ctx) => {
  if (!val.startsWith(`${REPLAY_EVENT_NAMESPACE}.`)) {
    ctx.addIssue({
      code: "custom",
      message: `Event must use ${REPLAY_EVENT_NAMESPACE}.* namespace (rejected: ${val})`,
    });
    return;
  }
  const productionPrefixes = [
    "production.",
    "mapable.care.",
    "mapable.transport.",
    "mapable.billing.",
    "audit.",
    "ledger.",
  ];
  for (const p of productionPrefixes) {
    if (val.startsWith(p)) {
      ctx.addIssue({
        code: "custom",
        message: `Production namespace rejected: ${val}`,
      });
      return;
    }
  }
  if (!(REPLAY_EVENT_TYPES as readonly string[]).includes(val)) {
    ctx.addIssue({
      code: "custom",
      message: `Unknown Replay Lab event type: ${val}`,
    });
  }
});

export const replayScenarioDocumentSchema = z.object({
  scenario: z.object({
    id: z.string().min(1),
    version: z.number().int().positive(),
    title: z.string().min(1),
    purpose: z.string().min(1),
    mode: replayProductModeSchema,
    author: z.string().min(1),
    reviewers: z.array(z.string()),
    lastReview: z.string().nullable(),
    deprecation: z.enum(["active", "deprecated", "retired"]),
    ontologyVersion: z.string().min(1),
    canonicalDomainVersions: z.record(z.string(), z.string()),
    policyVersions: z.record(z.string(), z.string()),
  }),
  participant: z.object({
    fixture: z.string().min(1),
  }),
  goal: z.object({
    type: z.string().min(1),
    outcome: z.string().min(1),
  }),
  requirements: z.object({
    communication: z
      .object({
        one_question_at_a_time: z.boolean().optional(),
        response_time_seconds: z.number().optional(),
        written_and_spoken: z.boolean().optional(),
        aac_required: z.boolean().optional(),
      })
      .optional(),
    mobility: z
      .object({
        step_free: z.boolean().optional(),
        minimum_clear_width_mm: z.number().optional(),
        power_chair_transport: z.boolean().optional(),
      })
      .optional(),
    authority: z
      .object({
        participant_directed: z.boolean().optional(),
        supporter_may_not_consent: z.boolean().optional(),
      })
      .optional(),
  }),
  world: z
    .object({
      precinct: z.string(),
      harbourSnapshotId: z.string().optional(),
    })
    .optional(),
  actors: z
    .array(
      z.object({
        id: z.string(),
        displayName: z.string(),
        role: replayActorRoleSchema,
        organisationId: z.string().nullable(),
        authorityScopes: z.array(z.string()),
        communicationCapabilities: z.array(z.string()),
        availableActions: z.array(z.string()),
        prohibitedActions: z.array(z.string()),
        responseDelaySeconds: z.number(),
        failureBehaviour: z.string(),
      }),
    )
    .optional(),
  timeline: z.array(
    z.object({
      at: z.string().regex(/^\d{2}:\d{2}$/),
      event: timelineEventSchema,
      data: z.record(z.string(), z.unknown()).optional(),
      actor: z.string().optional(),
    }),
  ),
  chaos_cards: z.array(z.string()).optional(),
  expected: z.array(z.string().min(1)).min(1),
  prohibited: z.array(z.string()).optional(),
  localisation: z
    .object({
      locale: z.string(),
      timeZone: z.string(),
    })
    .optional(),
});

export type ValidatedReplayScenario = z.infer<typeof replayScenarioDocumentSchema>;

export function validateScenarioDocument(input: unknown): ValidatedReplayScenario {
  return replayScenarioDocumentSchema.parse(input);
}

export function safeValidateScenarioDocument(input: unknown) {
  return replayScenarioDocumentSchema.safeParse(input);
}

export function validateScenarioYaml(source: string): ValidatedReplayScenario {
  const parsed = parseYamlLite(source);
  return validateScenarioDocument(parsed);
}
