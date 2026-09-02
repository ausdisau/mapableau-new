import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  grantResearchPurposeConsent,
  withdrawResearchPurposeConsent,
} from "@/lib/research/co-design-governance-service";
import { researchConsentPurposeSchema } from "@mapable/research";

const consentActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("grant"),
    programmeId: z.string().cuid(),
    purpose: researchConsentPurposeSchema,
    plainLanguageSummary: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("withdraw"),
    programmeId: z.string().cuid(),
    purpose: researchConsentPurposeSchema,
  }),
]);

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    return jsonBodyErrorResponse(e);
  }

  const parsed = consentActionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid consent payload", 400);
  }

  try {
    if (parsed.data.action === "grant") {
      const record = await grantResearchPurposeConsent({
        participantId: user.id,
        programmeId: parsed.data.programmeId,
        purpose: parsed.data.purpose,
        plainLanguageSummary: parsed.data.plainLanguageSummary,
        actorUserId: user.id,
      });
      return jsonOk({ consent: record });
    }

    const record = await withdrawResearchPurposeConsent({
      participantId: user.id,
      programmeId: parsed.data.programmeId,
      purpose: parsed.data.purpose,
      actorUserId: user.id,
    });
    return jsonOk({ consent: record });
  } catch (error) {
    if (error instanceof Error && error.message === "RESEARCH_GOVERNANCE_DISABLED") {
      return jsonError("Research governance is disabled", 503);
    }
    throw error;
  }
}
