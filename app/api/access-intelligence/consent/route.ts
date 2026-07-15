import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  evaluateActionPolicy,
  executeApprovedSensitiveAction,
  revokeConsentGrant,
  storeConsentGrant,
} from "@/lib/access-intelligence/rights/action-policy";

export async function POST(request: Request) {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json();

  if (body?.action === "grant") {
    const grant = storeConsentGrant({
      id: `consent-${Date.now()}`,
      userId,
      purpose: body.purpose ?? "venue_verification",
      fieldKeys: body.fieldKeys ?? [],
      recipientType: body.recipientType ?? "venue",
      recipientId: body.recipientId,
      grantedAt: new Date().toISOString(),
      expiresAt: body.expiresAt,
    });
    return Response.json({ grant });
  }

  if (body?.action === "revoke") {
    return Response.json({ grant: revokeConsentGrant(String(body.grantId)) });
  }

  const schema = z.object({
    action: z.enum([
      "requestVenueVerification",
      "submitBarrierReport",
      "shareAccessPassport",
      "shareVisitPlan",
    ]),
    approved: z.boolean(),
    recipient: z.string(),
    purpose: z.string(),
    payloadFields: z.array(z.string()),
    shareableFields: z.array(z.string()),
    consentGrantId: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid consent action" }, { status: 400 });
  }

  if (!parsed.data.approved) {
    const policy = evaluateActionPolicy({
      ...parsed.data,
      userId,
      requestedFields: parsed.data.payloadFields,
    });
    return Response.json({
      policy,
      executed: false,
      note: "Approval cancelled — no write performed.",
    });
  }

  const result = executeApprovedSensitiveAction({
    ...parsed.data,
    userId,
  });
  return Response.json({ ...result, executed: result.policy.allowed });
}
