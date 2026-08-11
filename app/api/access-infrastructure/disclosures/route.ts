import type { NextRequest } from "next/server";
import type { AccessDisclosureRecipientRole } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessInfrastructureFlags } from "@/lib/access/infrastructure";
import {
  confirmDisclosure,
  previewDisclosure,
  revokeDisclosure,
  upsertDisclosurePolicy,
} from "@/lib/access/infrastructure/disclosure-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!accessInfrastructureFlags.enabled || !accessInfrastructureFlags.passport) {
    return jsonError("Access disclosure is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const action = body?.action as string;

  if (action === "preview") {
    const preview = await previewDisclosure({
      userId: user.id,
      recipientRole: body.recipientRole as AccessDisclosureRecipientRole,
      purpose: body.purpose,
      requestedAttributes: body.requestedAttributes ?? [],
    });
    if (!preview) return jsonError("Passport not found", 404);
    return jsonOk({ preview, productionClaim: "none" });
  }

  if (action === "confirm") {
    const receipt = await confirmDisclosure({
      userId: user.id,
      recipientRole: body.recipientRole as AccessDisclosureRecipientRole,
      recipientRef: body.recipientRef,
      purpose: body.purpose,
      attributeKeys: body.attributeKeys ?? [],
      policyId: body.policyId,
      consentRecordId: body.consentRecordId,
      consentVersion: body.consentVersion,
    });
    if (!receipt) return jsonError("Passport not found", 404);
    return jsonOk({ receipt, productionClaim: "none" });
  }

  if (action === "revoke") {
    const ok = await revokeDisclosure({ userId: user.id, receiptId: body.receiptId });
    if (!ok) return jsonError("Receipt not found", 404);
    return jsonOk({ revoked: true, productionClaim: "none" });
  }

  if (action === "upsert_policy") {
    const policyId = await upsertDisclosurePolicy({
      userId: user.id,
      recipientRole: body.recipientRole as AccessDisclosureRecipientRole,
      purpose: body.purpose,
      allowedAttributes: body.allowedAttributes ?? [],
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    if (!policyId) return jsonError("Passport not found", 404);
    return jsonOk({ policyId, productionClaim: "none" });
  }

  return jsonError("Unknown disclosure action", 400);
}
