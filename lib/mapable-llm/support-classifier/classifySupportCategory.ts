import { createHash, randomUUID } from "node:crypto";

import OpenAI from "openai";

import {
  applyLocalGuardrailChecks,
  parseSupportClassificationResult,
  SUPPORT_CLASSIFIER_PROMPT_VERSION,
  supportClassificationJsonSchema,
  type SupportClassificationResponse,
} from "@/lib/mapable-llm/support-classifier/supportCategorySchema";

const DEFAULT_MODEL = "gpt-4o-mini";

const SYSTEM_INSTRUCTIONS = `You are MapAble's support category assistant for Australian disability and NDIS-related services.

Your task: read participant free text and suggest which support CATEGORIES may be relevant for routing to human staff or tools. You classify themes only.

STRICT RULES — you MUST follow these:
- Do NOT diagnose medical or mental health conditions.
- Do NOT state or imply NDIS eligibility, funding approval, or plan outcomes.
- Do NOT finalise or prescribe specific services, providers, or supports — only describe possible category themes.
- Use plain language suitable for participants in participantSummary.
- If text is vague, use code "unclear" and list missingInformation.
- Include guardrailFlags that apply (always include not_a_diagnosis, not_ndis_eligibility_decision, not_final_service_recommendation).
- Add may_need_human_review when safety, abuse, crisis, or clinical diagnosis seems implied.
- confidence is 0–1 (calibrated; lower when uncertain).
- reasoning is brief, factual, non-clinical.

Prefer these category codes when they fit:
personal_care, accessible_transport, employment_support, sensory_access_need, community_participation, housing_tenancy, assistive_technology, plan_management, unclear`;

export class SupportClassifierNotConfiguredError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured");
    this.name = "SupportClassifierNotConfiguredError";
  }
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new SupportClassifierNotConfiguredError();
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function hashInput(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function extractOutputText(response: OpenAI.Responses.Response): string {
  if (typeof response.output_text === "string" && response.output_text.length > 0) {
    return response.output_text;
  }
  const parts: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const block of item.content ?? []) {
      if (block.type === "output_text" && "text" in block) {
        parts.push(block.text);
      }
    }
  }
  return parts.join("");
}

export type ClassifySupportCategoryInput = {
  text: string;
  /** Optional stable id for audit correlation (participant session, ticket, etc.) */
  correlationId?: string;
  requestId?: string;
};

export async function classifySupportCategory(
  input: ClassifySupportCategoryInput
): Promise<SupportClassificationResponse> {
  const text = input.text.trim();
  if (!text) {
    throw new Error("Participant text is required");
  }
  if (text.length > 4000) {
    throw new Error("Participant text must be 4000 characters or fewer");
  }

  const requestId = input.requestId ?? randomUUID();
  const model =
    process.env.OPENAI_SUPPORT_CLASSIFIER_MODEL?.trim() || DEFAULT_MODEL;
  const classifiedAt = new Date().toISOString();

  const client = getOpenAIClient();
  const response = await client.responses.create({
    model,
    temperature: 0.2,
    max_output_tokens: 1200,
    store: false,
    metadata: {
      mapable_service: "support_classifier",
      mapable_prompt_version: SUPPORT_CLASSIFIER_PROMPT_VERSION,
      mapable_request_id: requestId,
      ...(input.correlationId
        ? { mapable_correlation_id: input.correlationId }
        : {}),
    },
    instructions: SYSTEM_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Participant message:\n\n${text}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "support_category_classification",
        strict: true,
        schema: supportClassificationJsonSchema,
      },
    },
  });

  const rawText = extractOutputText(response);
  if (!rawText) {
    throw new Error("OpenAI returned an empty classification response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    throw new Error("OpenAI returned invalid JSON for classification");
  }

  const validated = applyLocalGuardrailChecks(
    parseSupportClassificationResult(parsed)
  );

  return {
    classification: validated,
    audit: {
      requestId,
      classifiedAt,
      model: response.model ?? model,
      promptVersion: SUPPORT_CLASSIFIER_PROMPT_VERSION,
      inputCharacterCount: text.length,
      inputHash: hashInput(text),
      openaiResponseId: response.id,
    },
  };
}

export function resetSupportClassifierClientForTests() {
  openaiClient = null;
}
