import { z } from "zod";

import {
  PERSONA_TURN_SCHEMA_VERSION,
  type PersonaTurn,
} from "@/lib/virtual-persona/types";

const sourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  evidenceStatus: z.enum([
    "synthetic_fixture",
    "unverified",
    "missing",
    "not_applicable",
  ]),
  href: z.string().url().optional(),
});

const draftSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  executable: z.literal(false),
});

export const personaTurnSchema = z.object({
  schemaVersion: z.literal(PERSONA_TURN_SCHEMA_VERSION),
  turnId: z.string().min(1),
  responseType: z.enum([
    "informational",
    "clarification",
    "draft_support_request",
    "refusal",
    "error",
    "fallback",
  ]),
  displayText: z.string().min(1),
  sourceReferences: z.array(sourceSchema),
  evidenceStatus: z.enum([
    "synthetic_fixture",
    "unverified",
    "missing",
    "not_applicable",
  ]),
  uncertainties: z.array(z.string()),
  suggestedQuestions: z.array(z.string()),
  editableDraft: draftSchema.nullable(),
  requiresHumanReview: z.boolean(),
  actionAuthority: z.literal("none"),
  canUseNonAiFallback: z.boolean(),
});

export type PersonaTurnValidation =
  | { ok: true; turn: PersonaTurn }
  | { ok: false; reason: "invalid_response"; issues: string[] };

export function validatePersonaTurn(input: unknown): PersonaTurnValidation {
  const parsed = personaTurnSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_response",
      issues: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
      ),
    };
  }
  return { ok: true, turn: parsed.data };
}
