import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { wedgesConfig } from "@/lib/config/wedges";
import { createSupportConciergeRequest } from "@/lib/wedges/availability/availability-service";
import {
  ACCESS_NEED_IDS,
  FUNDING_TYPES,
  REQUESTER_ROLES,
  SERVICE_MODES,
  SUPPORT_CATEGORIES,
  URGENCY_LEVELS,
} from "@/types/wedges";

const bodySchema = z.object({
  requesterRole: z.enum(REQUESTER_ROLES),
  supportCategory: z.enum(SUPPORT_CATEGORIES),
  locationPostcode: z.string().trim().regex(/^\d{4}$/, "Enter a 4-digit postcode"),
  locationSuburb: z.string().trim().min(1, "Enter a suburb"),
  serviceMode: z.enum(SERVICE_MODES),
  urgency: z.enum(URGENCY_LEVELS),
  accessNeeds: z.array(z.enum(ACCESS_NEED_IDS)),
  fundingType: z.union([z.enum(FUNDING_TYPES), z.literal("unsure")]),
  previousIssues: z.string().trim().max(2000).optional(),
  consentGiven: z.boolean().refine((value) => value === true, {
    message: "Consent is required",
  }),
});

export async function POST(request: Request) {
  if (!wedgesConfig.mvpEnabled) {
    return jsonError("Wedges MVP is not enabled", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const result = await createSupportConciergeRequest({
    ...parsed.data,
    previousIssues: parsed.data.previousIssues || undefined,
  });

  return jsonOk({
    id: result.id,
    persisted: result.persisted,
    message: result.persisted
      ? "Request saved successfully."
      : "Request received in demo mode. Enable WEDGES_PERSIST_REQUESTS to save it to the database.",
  });
}
