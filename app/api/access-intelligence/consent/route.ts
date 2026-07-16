import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  grantDurableAccessConsent,
  revokeDurableAccessConsent,
} from "@/lib/access-intelligence/consent-durable";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import {
  evaluateActionPolicy,
  executeApprovedSensitiveAction,
  revokeConsentGrant,
  storeConsentGrant,
  type ConsentGrant,
} from "@/lib/access-intelligence/rights/action-policy";

export async function POST(request: Request) {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  const body = await request.json();

  if (body?.action === "grant") {
    const grantInput: ConsentGrant = {
      id: `consent-${Date.now()}`,
      userId,
      purpose: body.purpose ?? "venue_verification",
      fieldKeys: body.fieldKeys ?? [],
      recipientType: body.recipientType ?? "venue",
      recipientId: body.recipientId,
      grantedAt: new Date().toISOString(),
      expiresAt: body.expiresAt,
    };

    if (
      accessIntelligenceFlags.usePrisma &&
      !accessIntelligenceFlags.demoMode &&
      !userId.startsWith("demo-")
    ) {
      try {
        const durable = await grantDurableAccessConsent({
          grant: grantInput,
          createdById: userId,
          grantedToOrganisationId: body.grantedToOrganisationId,
          grantedToUserId: body.grantedToUserId,
        });
        return Response.json({
          grant: durable.grant,
          consentRecordId: durable.consentRecordId,
          durable: true,
        });
      } catch {
        // Fall through to in-memory grant when DB/user FK unavailable.
      }
    }

    const grant = storeConsentGrant(grantInput);
    return Response.json({ grant, durable: false });
  }

  if (body?.action === "revoke") {
    const grantId = String(body.grantId);
    if (
      accessIntelligenceFlags.usePrisma &&
      !accessIntelligenceFlags.demoMode &&
      !userId.startsWith("demo-")
    ) {
      try {
        const durable = await revokeDurableAccessConsent({
          grantId,
          revokedById: userId,
        });
        return Response.json({
          grant: durable.grant,
          consentRecordId: durable.consentRecordId,
          durable: Boolean(durable.consentRecordId),
        });
      } catch {
        // Fall through.
      }
    }
    return Response.json({ grant: revokeConsentGrant(grantId), durable: false });
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
