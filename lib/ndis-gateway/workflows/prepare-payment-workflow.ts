import type { NdisBillingRoute, Prisma } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { evaluateBatchPolicy } from "@/lib/ndis-gateway/billing/batch-policy";
import { createDocumentPackage } from "@/lib/ndis-gateway/documents/document-package-service";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { mockDispatchAdapter } from "@/lib/ndis-gateway/routing/adapters/mock-dispatch";
import { ndiaPortalExportAdapter } from "@/lib/ndis-gateway/routing/adapters/ndia-portal-export";
import { planManagerDispatchAdapter } from "@/lib/ndis-gateway/routing/adapters/plan-manager";
import { privatePayDispatchAdapter } from "@/lib/ndis-gateway/routing/adapters/private-pay";
import { selfManagedDispatchAdapter } from "@/lib/ndis-gateway/routing/adapters/self-managed";
import type { RouteDispatchResult } from "@/lib/ndis-gateway/routing/adapters/types";
import { getSubmissionApproval } from "@/lib/ndis-gateway/security/claim-approval-service";
import {
  createClaimSnapshot,
  getClaimSnapshotSafe,
} from "@/lib/ndis-gateway/security/claim-snapshot-service";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import type { ExternalClaimPayload } from "@/lib/ndis-gateway/security/sensitive-payload";
import { billingRouteToPaymentRoute } from "@/lib/ndis-gateway/routing/route-policy";
import { lockBillingPackage } from "@/lib/ndis-gateway/workflows/lock-billing-package";
import { prisma } from "@/lib/prisma";

export type PreparePaymentInput = {
  organisationId: string;
  actorUserId: string;
  /** Actor used for Wave 2 snapshot/approval checks (NDIA). */
  user: CurrentUser;
  billableItemIds: string[];
  billingRoute: NdisBillingRoute;
  dryRun?: boolean;
  /** When set, use this batch for NDIA export metadata. */
  billingBatchId?: string | null;
};

export type PreparePaymentResult = {
  correlationId: string;
  dryRun: boolean;
  blocked: boolean;
  blockingIssues: string[];
  documentIds: string[];
  dispatch: RouteDispatchResult | null;
  snapshotId: string | null;
  approvalId: string | null;
};

function adapterForRoute(route: NdisBillingRoute) {
  switch (route) {
    case "ndis_self_managed":
      return selfManagedDispatchAdapter;
    case "ndis_plan_managed":
      return planManagerDispatchAdapter;
    case "ndis_ndia_managed":
      return ndiaPortalExportAdapter;
    case "private_pay":
      return privatePayDispatchAdapter;
    default:
      return mockDispatchAdapter;
  }
}

/**
 * Prepare payment for billable items.
 * dryRun: validate + build drafts without persisting dispatch side-effects where possible.
 * NDIA: require Wave 2 snapshot + approval before package dispatch (create snapshot if missing;
 * approval required for dispatch).
 */
export async function preparePaymentForBillableItems(
  input: PreparePaymentInput
): Promise<PreparePaymentResult> {
  const correlationId = createCorrelationId();
  const dryRun = Boolean(input.dryRun);
  const blockingIssues: string[] = [];

  const items = await prisma.ndisBillableServiceItem.findMany({
    where: {
      organisationId: input.organisationId,
      id: { in: input.billableItemIds },
    },
  });
  if (items.length !== input.billableItemIds.length) {
    throw new Error("BILLABLE_ITEMS_NOT_FOUND");
  }

  const policy = evaluateBatchPolicy({
    billingRoute: input.billingRoute,
    members: items.map((i) => ({
      billableItemId: i.id,
      participantId: i.participantId,
      billingRoute: i.billingRoute,
      status: i.status,
      totalCents: i.totalCents,
      paymentHold: i.paymentHold,
    })),
  });
  if (!policy.ok) {
    blockingIssues.push(...policy.issues.map((i) => `${i.code}: ${i.message}`));
  }

  let snapshotId: string | null = null;
  let approvalId: string | null = null;

  if (input.billingRoute === "ndis_ndia_managed" && blockingIssues.length === 0) {
    // Prefer existing snapshot on first item; else create a package-level snapshot.
    const existingSnapshotId = items.find((i) => i.claimSnapshotId)?.claimSnapshotId;
    if (existingSnapshotId) {
      const safe = await getClaimSnapshotSafe(existingSnapshotId, input.user);
      snapshotId = safe.id;
    } else if (!dryRun) {
      const org = await prisma.organisation.findUnique({
        where: { id: input.organisationId },
      });
      const totalCents = items.reduce((s, i) => s + (i.totalCents ?? 0), 0);
      const externalPayload: ExternalClaimPayload = {
        claimType: "registered_provider",
        provider: {
          abn: org?.abn ?? null,
          ndisRegistrationNumber: org?.ndisRegistrationNumber ?? "",
          organisationId: input.organisationId,
          name: org?.name ?? "",
        },
        participant: {
          ndisNumber: null,
          ndisNumberMasked: null,
          mapableUserId: items[0]?.participantId ?? "",
        },
        invoiceReference: {},
        servicePeriod: {
          start: items[0]!.serviceStartAt.toISOString().slice(0, 10),
          end: items[items.length - 1]!.serviceEndAt.toISOString().slice(0, 10),
        },
        lines: items.map((i, idx) => ({
          lineNumber: idx + 1,
          supportItemCode: i.supportItemCode ?? "",
          description: i.supportDescription,
          serviceDate: i.serviceStartAt.toISOString().slice(0, 10),
          quantity: Number(i.quantity),
          unitPriceCents: i.unitPriceCents ?? 0,
          totalCents: i.totalCents ?? 0,
          gstIncluded: false,
        })),
        totals: {
          subtotalCents: totalCents,
          taxCents: 0,
          totalCents,
          currency: "AUD",
        },
        metadata: {
          builtAt: new Date().toISOString(),
          mapableVersion: "wave4",
        },
      };

      const snap = await createClaimSnapshot({
        user: input.user,
        organisationId: input.organisationId,
        participantId: items[0]!.participantId ?? input.user.id,
        sourceType: "manual",
        sourceId: correlationId,
        fundingRoute: "ndia_managed",
        externalPayload,
        forDirectSubmission: true,
      });
      snapshotId = snap.snapshot.id;
      await prisma.ndisBillableServiceItem.updateMany({
        where: { id: { in: items.map((i) => i.id) } },
        data: { claimSnapshotId: snapshotId },
      });
    } else {
      blockingIssues.push(
        "NDIA_SNAPSHOT_REQUIRED: dryRun noted — snapshot will be created on live prepare."
      );
    }

    if (snapshotId) {
      const approvalResult = await getSubmissionApproval(snapshotId);
      if (!approvalResult) {
        blockingIssues.push(
          "NDIA_APPROVAL_REQUIRED: Wave 2 claim snapshot approval is required before NDIA dispatch."
        );
      } else {
        approvalId = approvalResult.approval.id;
      }
    } else if (!dryRun) {
      blockingIssues.push("NDIA_SNAPSHOT_MISSING");
    }
  }

  if (blockingIssues.length > 0) {
    return {
      correlationId,
      dryRun,
      blocked: true,
      blockingIssues,
      documentIds: [],
      dispatch: null,
      snapshotId,
      approvalId,
    };
  }

  const documentIds: string[] = [];
  if (!dryRun) {
    await lockBillingPackage({
      organisationId: input.organisationId,
      actorUserId: input.actorUserId,
      billableItemIds: input.billableItemIds,
      reason: "prepare_payment",
    });

    const doc = await createDocumentPackage({
      organisationId: input.organisationId,
      actorUserId: input.actorUserId,
      billingRoute: input.billingRoute,
      billableItemIds: input.billableItemIds,
      billingBatchId: input.billingBatchId,
    });
    documentIds.push(doc.documentId);
  }

  const lines = items.map((i) => ({
    billableItemId: i.id,
    participantId: i.participantId,
    supportItemCode: i.supportItemCode,
    description: i.supportDescription,
    serviceStartAt: i.serviceStartAt.toISOString(),
    serviceEndAt: i.serviceEndAt.toISOString(),
    quantity: i.quantity.toString(),
    unitPriceCents: i.unitPriceCents ?? 0,
    totalCents: i.totalCents ?? 0,
  }));

  const adapter = adapterForRoute(input.billingRoute);
  const dispatch = await adapter.dispatch({
    organisationId: input.organisationId,
    actorUserId: input.actorUserId,
    correlationId,
    billingRoute: input.billingRoute,
    batchId: input.billingBatchId,
    dryRun,
    lineIds: input.billableItemIds,
    lines,
  });

  if (!dryRun) {
    await prisma.ndisWorkflowTransition.create({
      data: {
        organisationId: input.organisationId,
        entityType: "ndis_payment_prepare",
        entityId: correlationId,
        fromStatus: "ready",
        toStatus: "prepared",
        actorUserId: input.actorUserId,
        correlationId,
        metadataJson: sanitiseAuditJson({
          billingRoute: input.billingRoute,
          paymentRoute: billingRouteToPaymentRoute(input.billingRoute),
          billableItemIds: input.billableItemIds,
          documentIds,
          snapshotId,
          approvalId,
          adapter: dispatch.adapterKind,
          markedSubmitted: dispatch.markedSubmitted,
        }) as Prisma.InputJsonValue,
      },
    });
  }

  return {
    correlationId,
    dryRun,
    blocked: false,
    blockingIssues: [],
    documentIds: [...documentIds, ...dispatch.documentIds],
    dispatch,
    snapshotId,
    approvalId,
  };
}
