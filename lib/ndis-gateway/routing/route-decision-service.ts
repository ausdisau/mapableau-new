import type {
  FundingSourceType,
  NdisBillingRoute,
  Prisma,
} from "@prisma/client";

import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { resolveBillingRoute } from "@/lib/ndis-gateway/routing/funding-route-resolver";
import { resolvePaymentDestination } from "@/lib/ndis-gateway/routing/payment-destination-resolver";
import {
  billingRouteToPaymentRoute,
} from "@/lib/ndis-gateway/routing/route-policy";
import {
  ROUTE_RESOLVER_VERSION,
  buildRouteProvenance,
} from "@/lib/ndis-gateway/routing/route-provenance";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export type DecideBillingRouteInput = {
  organisationId: string;
  participantId?: string | null;
  billableItemId?: string | null;
  actorUserId: string;
  fundingSourceType?: FundingSourceType | null;
  clientRequestedRoute?: NdisBillingRoute | null;
  allowClientOverride?: boolean;
  overrideReason?: string | null;
  matchedFundingSourceId?: string | null;
  matchedServiceAgreementId?: string | null;
};

export async function decideAndPersistBillingRoute(
  input: DecideBillingRouteInput
) {
  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
  });
  if (!org) {
    throw new Error("ORGANISATION_NOT_FOUND");
  }

  const routeResult = resolveBillingRoute({
    fundingSourceType: input.fundingSourceType,
    clientRequestedRoute: input.clientRequestedRoute,
    allowClientOverride: input.allowClientOverride,
    overrideReason: input.overrideReason,
  });

  const destination = resolvePaymentDestination({
    billingRoute: routeResult.billingRoute,
    providerRegistration: {
      claimed: org.ndisRegistrationClaimed,
      registrationNumber: org.ndisRegistrationNumber,
      active: org.ndisRegistrationClaimed,
    },
  });

  const blockingIssues = [
    ...routeResult.blockingIssues,
    ...destination.blockCodes,
  ];
  const decisionStatus =
    blockingIssues.length > 0 || destination.blocked
      ? "blocked"
      : "resolved";

  const provenance = buildRouteProvenance({
    matchedFundingSourceId: input.matchedFundingSourceId,
    matchedServiceAgreementId: input.matchedServiceAgreementId,
    fundingSourceType: input.fundingSourceType ?? null,
    overrideApplied: routeResult.overrideApplied,
    overrideReason: input.overrideReason,
    signals: [
      `correlationId=${createCorrelationId()}`,
      `status=${decisionStatus}`,
    ],
  });

  const decision = await prisma.ndisRouteDecision.create({
    data: {
      organisationId: input.organisationId,
      participantId: input.participantId ?? null,
      billableItemId: input.billableItemId ?? null,
      billingRoute: routeResult.billingRoute,
      ndisPaymentRoute: billingRouteToPaymentRoute(routeResult.billingRoute),
      paymentDestination: destination.destination,
      decisionStatus,
      matchedFundingSourceId: input.matchedFundingSourceId ?? null,
      matchedServiceAgreementId: input.matchedServiceAgreementId ?? null,
      warningsJson: [] as Prisma.InputJsonValue,
      blockingIssuesJson: blockingIssues as Prisma.InputJsonValue,
      provenanceJson: sanitiseAuditJson(
        provenance as unknown as Record<string, unknown>
      ) as Prisma.InputJsonValue,
      requiresHumanReview: blockingIssues.length > 0,
      resolverVersion: ROUTE_RESOLVER_VERSION,
      actorUserId: input.actorUserId,
      overrideReason: routeResult.overrideApplied
        ? input.overrideReason ?? null
        : null,
    },
  });

  return {
    decision,
    billingRoute: routeResult.billingRoute,
    ndisPaymentRoute: billingRouteToPaymentRoute(routeResult.billingRoute),
    paymentDestination: destination.destination,
    blocked: decisionStatus === "blocked",
    blockingIssues,
    correlationId: provenance.signals.find((s) => s.startsWith("correlationId=")),
  };
}

/** Lightweight resolve without persistence (pure + org lookup for registration). */
export async function resolveBillingRouteForOrganisation(input: {
  organisationId: string;
  fundingSourceType?: FundingSourceType | null;
  clientRequestedRoute?: NdisBillingRoute | null;
  allowClientOverride?: boolean;
  overrideReason?: string | null;
}) {
  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
  });
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");

  const routeResult = resolveBillingRoute({
    fundingSourceType: input.fundingSourceType,
    clientRequestedRoute: input.clientRequestedRoute,
    allowClientOverride: input.allowClientOverride,
    overrideReason: input.overrideReason,
  });
  const destination = resolvePaymentDestination({
    billingRoute: routeResult.billingRoute,
    providerRegistration: {
      claimed: org.ndisRegistrationClaimed,
      registrationNumber: org.ndisRegistrationNumber,
      active: org.ndisRegistrationClaimed,
    },
  });

  return {
    billingRoute: routeResult.billingRoute,
    ndisPaymentRoute: billingRouteToPaymentRoute(routeResult.billingRoute),
    paymentDestination: destination.destination,
    overrideApplied: routeResult.overrideApplied,
    blocked:
      routeResult.blockingIssues.length > 0 || destination.blocked,
    blockingIssues: [
      ...routeResult.blockingIssues,
      ...destination.blockCodes,
    ],
  };
}
