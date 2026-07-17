import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { decideAndPersistBillingRoute } from "@/lib/ndis-gateway/routing/route-decision-service";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  participantId: z.string().cuid().nullable().optional(),
  billableItemId: z.string().cuid().nullable().optional(),
  fundingSourceType: z
    .enum([
      "ndis_self_managed",
      "ndis_plan_managed",
      "ndis_agency_managed",
      "private_pay",
      "aged_care",
      "employer",
      "other",
    ])
    .nullable()
    .optional(),
  clientRequestedRoute: z
    .enum([
      "ndis_self_managed",
      "ndis_plan_managed",
      "ndis_ndia_managed",
      "private_pay",
      "pro_bono",
      "grant_funded",
      "employer_funded",
      "health_funded",
      "other",
      "unresolved",
    ])
    .nullable()
    .optional(),
  allowClientOverride: z.boolean().optional(),
  overrideReason: z.string().max(500).nullable().optional(),
  matchedFundingSourceId: z.string().cuid().nullable().optional(),
  matchedServiceAgreementId: z.string().cuid().nullable().optional(),
});

/** POST /api/provider/ndis/billing/resolve-route */
export async function POST(req: Request) {
  const user = await requireApiPermission("provider:billing:validate");
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  try {
    const result = await decideAndPersistBillingRoute({
      organisationId,
      actorUserId: user.id,
      participantId: parsed.data.participantId,
      billableItemId: parsed.data.billableItemId,
      fundingSourceType: parsed.data.fundingSourceType,
      clientRequestedRoute: parsed.data.clientRequestedRoute,
      allowClientOverride: parsed.data.allowClientOverride,
      overrideReason: parsed.data.overrideReason,
      matchedFundingSourceId: parsed.data.matchedFundingSourceId,
      matchedServiceAgreementId: parsed.data.matchedServiceAgreementId,
    });

    return jsonNdisOk({
      decisionId: result.decision.id,
      billingRoute: result.billingRoute,
      ndisPaymentRoute: result.ndisPaymentRoute,
      paymentDestination: result.paymentDestination,
      blocked: result.blocked,
      blockingIssues: result.blockingIssues,
      decisionStatus: result.decision.decisionStatus,
    });
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
