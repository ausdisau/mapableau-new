import { z } from "zod";

export const MAPABLE_AGENT_STUDIO_MODEL = "gpt-6-astra" as const;

export const mapAbleAgentStudioAgentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const mapAbleAgentStudioSessionIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const mapAbleAgentStudioCreateAgentSchema = z.object({
  name: z.string().trim().min(3).max(80),
  model: z.literal(MAPABLE_AGENT_STUDIO_MODEL),
  specializationInstructions: z.string().trim().max(6000).default(""),
  reasoningEffort: z.enum(["low", "medium", "high"]).default("medium"),
  verbosity: z.enum(["low", "medium", "high"]).default("medium"),
});

export const mapAbleAgentStudioCreateSessionSchema = z.object({
  agentId: mapAbleAgentStudioAgentIdSchema,
  initialInput: z.string().trim().min(1).max(4000),
  dataClassification: z.literal("synthetic_or_deidentified"),
});

export const mapAbleAgentStudioMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  dataClassification: z.literal("synthetic_or_deidentified"),
});

export type MapAbleAgentStudioCreateAgentInput = z.infer<
  typeof mapAbleAgentStudioCreateAgentSchema
>;

export type MapAbleAgentStudioCreateSessionInput = z.infer<
  typeof mapAbleAgentStudioCreateSessionSchema
>;

export type MapAbleAgentStudioMessageInput = z.infer<
  typeof mapAbleAgentStudioMessageSchema
>;

export const MAPABLE_AGENT_STUDIO_AUTONOMY = [
  {
    level: "A0",
    label: "Explain",
    status: "allowed",
    description: "Explain MapAble information and evidence.",
  },
  {
    level: "A1",
    label: "Draft",
    status: "allowed",
    description: "Draft goals, questions, messages and support requests.",
  },
  {
    level: "A2",
    label: "Recommend",
    status: "allowed",
    description:
      "Present options only after deterministic mandatory filtering.",
  },
  {
    level: "A3",
    label: "Prepare",
    status: "approval_required",
    description: "Prepare an action for participant or human review.",
  },
  {
    level: "A4",
    label: "Execute reversible action",
    status: "disabled",
    description: "Disabled in the v0.1 studio.",
  },
  {
    level: "A5",
    label: "High-impact autonomy",
    status: "prohibited",
    description:
      "Payments, eligibility, clinical decisions, incidents and final assignment are prohibited.",
  },
] as const;
