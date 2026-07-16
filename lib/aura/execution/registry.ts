import { randomUUID } from "crypto";

import type { AuraProposalActionType } from "../proposals";
import type {
  AuraAuthorisedExecutionContext,
  AuraCancellationContext,
  AuraCancellationResult,
  AuraCompensationContext,
  AuraCompensationResult,
  AuraExecutionContext,
  AuraPostconditionContext,
  AuraServicePreflight,
  AuraServiceReceipt,
} from "./types";
import { getExecutionMode } from "./flags";

/** In-memory application records created by demo/supervised execution adapters. */
export const applicationRecords = {
  venueVerificationRequests: new Map<
    string,
    {
      id: string;
      placeId: string;
      questions: string[];
      recipientLabel: string;
      fieldsShared: string[];
      deliveryStatus: string;
      missionId: string;
      proposalId: string;
    }
  >(),
  visitPlanShares: new Map<
    string,
    {
      id: string;
      planId: string;
      recipientLabel: string;
      fieldsShared: string[];
      expiresAt: string;
      revokedAt?: string;
      missionId: string;
    }
  >(),
  supporterNotifications: new Map<
    string,
    {
      id: string;
      supporterLabel: string;
      messageSummary: string;
      fieldsShared: string[];
      deliveryStatus: string;
      missionId: string;
    }
  >(),
  transportRequests: new Map<
    string,
    {
      id: string;
      pickup: string;
      destination: string;
      mobilityRequirements: string;
      companionCount: number;
      status: string;
      missionId: string;
      proposalId: string;
    }
  >(),
  barrierReports: new Map<
    string,
    {
      id: string;
      placeId: string;
      description: string;
      moderationState: string;
      privacyChoice: string;
      missionId: string;
    }
  >(),
};

export function resetApplicationRecordStore(): void {
  applicationRecords.venueVerificationRequests.clear();
  applicationRecords.visitPlanShares.clear();
  applicationRecords.supporterNotifications.clear();
  applicationRecords.transportRequests.clear();
  applicationRecords.barrierReports.clear();
}

function demoDeliveryState(channel: string): AuraServiceReceipt["deliveryState"] {
  const mode = getExecutionMode();
  if (mode === "demo") {
    return { channel, status: "queued", externalReference: `demo-${randomUUID().slice(0, 8)}` };
  }
  return { channel, status: "not_configured" };
}

async function preflightVenue(
  ctx: AuraExecutionContext,
): Promise<AuraServicePreflight> {
  void ctx;
  return {
    passed: true,
    errors: [],
    warnings: [],
    adapterState: getExecutionMode() === "demo" ? "mock_only" : "not_configured",
    serviceAvailable: true,
  };
}

async function executeVenue(
  ctx: AuraAuthorisedExecutionContext,
): Promise<AuraServiceReceipt> {
  const questions = (ctx.payload.questions as string[]) ?? [];
  const placeId = String(ctx.payload.placeId ?? "unknown");
  const id = randomUUID();
  const delivery = demoDeliveryState("messaging");
  applicationRecords.venueVerificationRequests.set(id, {
    id,
    placeId,
    questions,
    recipientLabel: ctx.recipient.label,
    fieldsShared: ctx.disclosure.fieldsShared,
    deliveryStatus: delivery?.status ?? "unknown",
    missionId: ctx.missionId,
    proposalId: ctx.proposalId,
  });
  return {
    receiptReference: id,
    recordsCreated: [{ recordType: "VenueVerificationRequest", recordId: id }],
    deliveryState: delivery,
  };
}

async function verifyVenuePost(
  ctx: AuraPostconditionContext,
): Promise<{ condition: string; passed: boolean; evidenceReference?: string }[]> {
  const id = ctx.serviceReceipt.receiptReference;
  const rec = applicationRecords.venueVerificationRequests.get(id);
  return [
    {
      condition: "verification_request_exists",
      passed: Boolean(rec),
      evidenceReference: id,
    },
    {
      condition: "questions_match_approval",
      passed: Boolean(
        rec &&
          JSON.stringify(rec.questions) ===
            JSON.stringify(ctx.payload.questions ?? []),
      ),
    },
    {
      condition: "recipient_matches",
      passed: rec?.recipientLabel === ctx.recipient.label,
    },
    {
      condition: "disclosure_exact",
      passed: Boolean(
        rec &&
          JSON.stringify(rec.fieldsShared.sort()) ===
            JSON.stringify(ctx.disclosure.fieldsShared.sort()),
      ),
    },
    {
      condition: "delivery_state_recorded",
      passed: Boolean(ctx.serviceReceipt.deliveryState),
    },
  ];
}

async function preflightVisitPlan(
  ctx: AuraExecutionContext,
): Promise<AuraServicePreflight> {
  void ctx;
  return { passed: true, errors: [], warnings: [], adapterState: "mock_only", serviceAvailable: true };
}

async function executeVisitPlan(
  ctx: AuraAuthorisedExecutionContext,
): Promise<AuraServiceReceipt> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  applicationRecords.visitPlanShares.set(id, {
    id,
    planId: String(ctx.payload.planId ?? ""),
    recipientLabel: ctx.recipient.label,
    fieldsShared: ctx.disclosure.fieldsShared,
    expiresAt,
    missionId: ctx.missionId,
  });
  return {
    receiptReference: id,
    recordsCreated: [{ recordType: "VisitPlanShareGrant", recordId: id }],
    deliveryState: demoDeliveryState("secure_link"),
  };
}

async function verifyVisitPlanPost(ctx: AuraPostconditionContext) {
  const id = ctx.serviceReceipt.receiptReference;
  const rec = applicationRecords.visitPlanShares.get(id);
  return [
    { condition: "share_grant_exists", passed: Boolean(rec), evidenceReference: id },
    { condition: "expiry_stored", passed: Boolean(rec?.expiresAt) },
    { condition: "fields_scoped", passed: Boolean(rec?.fieldsShared.length) },
    { condition: "recipient_correct", passed: rec?.recipientLabel === ctx.recipient.label },
    { condition: "revocation_supported", passed: true },
  ];
}

async function preflightSupporter(ctx: AuraExecutionContext): Promise<AuraServicePreflight> {
  void ctx;
  return { passed: true, errors: [], warnings: [], adapterState: "mock_only", serviceAvailable: true };
}

async function executeSupporter(ctx: AuraAuthorisedExecutionContext): Promise<AuraServiceReceipt> {
  const id = randomUUID();
  const delivery = demoDeliveryState("notification");
  applicationRecords.supporterNotifications.set(id, {
    id,
    supporterLabel: ctx.recipient.label,
    messageSummary: String(ctx.payload.messageSummary ?? ""),
    fieldsShared: ctx.disclosure.fieldsShared,
    deliveryStatus: delivery?.status ?? "queued",
    missionId: ctx.missionId,
  });
  return {
    receiptReference: id,
    recordsCreated: [{ recordType: "SupporterNotification", recordId: id }],
    deliveryState: delivery,
  };
}

async function verifySupporterPost(ctx: AuraPostconditionContext) {
  const id = ctx.serviceReceipt.receiptReference;
  const rec = applicationRecords.supporterNotifications.get(id);
  return [
    { condition: "notification_exists", passed: Boolean(rec), evidenceReference: id },
    { condition: "recipient_authorised", passed: Boolean(rec?.supporterLabel) },
    { condition: "payload_matches", passed: Boolean(rec) },
    { condition: "delivery_status_known", passed: Boolean(ctx.serviceReceipt.deliveryState) },
  ];
}

async function preflightTransport(ctx: AuraExecutionContext): Promise<AuraServicePreflight> {
  void ctx;
  return { passed: true, errors: [], warnings: [], adapterState: "mock_only", serviceAvailable: true };
}

async function executeTransport(ctx: AuraAuthorisedExecutionContext): Promise<AuraServiceReceipt> {
  const idempotencyProbe = [...applicationRecords.transportRequests.values()].find(
    (r) => r.proposalId === ctx.proposalId && r.missionId === ctx.missionId,
  );
  if (idempotencyProbe) {
    return {
      receiptReference: idempotencyProbe.id,
      recordsCreated: [{ recordType: "TransportTripRequest", recordId: idempotencyProbe.id }],
    };
  }
  const id = randomUUID();
  applicationRecords.transportRequests.set(id, {
    id,
    pickup: String(ctx.payload.pickup ?? ""),
    destination: String(ctx.payload.destination ?? ""),
    mobilityRequirements: String(ctx.payload.vehicleCapabilities ?? ""),
    companionCount: Number(ctx.payload.companionCount ?? 1),
    status: "requested",
    missionId: ctx.missionId,
    proposalId: ctx.proposalId,
  });
  return {
    receiptReference: id,
    recordsCreated: [{ recordType: "TransportTripRequest", recordId: id }],
    deliveryState: { channel: "transport", status: "not_required" },
  };
}

async function verifyTransportPost(ctx: AuraPostconditionContext) {
  const id = ctx.serviceReceipt.receiptReference;
  const rec = applicationRecords.transportRequests.get(id);
  return [
    { condition: "request_exists", passed: Boolean(rec), evidenceReference: id },
    { condition: "not_labelled_booked", passed: rec?.status === "requested" },
    { condition: "accessibility_matches", passed: Boolean(rec?.mobilityRequirements) },
    { condition: "no_duplicate", passed: true },
    { condition: "mission_linked", passed: rec?.missionId === ctx.missionId },
  ];
}

async function preflightBarrier(ctx: AuraExecutionContext): Promise<AuraServicePreflight> {
  void ctx;
  return { passed: true, errors: [], warnings: [], adapterState: "mock_only", serviceAvailable: true };
}

async function executeBarrier(ctx: AuraAuthorisedExecutionContext): Promise<AuraServiceReceipt> {
  const id = randomUUID();
  applicationRecords.barrierReports.set(id, {
    id,
    placeId: String(ctx.payload.placeId ?? ""),
    description: String(ctx.payload.description ?? ""),
    moderationState: "pending_moderation",
    privacyChoice: "moderation_only",
    missionId: ctx.missionId,
  });
  return {
    receiptReference: id,
    recordsCreated: [{ recordType: "BarrierReport", recordId: id }],
    deliveryState: { channel: "moderation", status: "queued" },
  };
}

async function verifyBarrierPost(ctx: AuraPostconditionContext) {
  const id = ctx.serviceReceipt.receiptReference;
  const rec = applicationRecords.barrierReports.get(id);
  return [
    { condition: "report_exists", passed: Boolean(rec), evidenceReference: id },
    { condition: "moderation_pending", passed: rec?.moderationState === "pending_moderation" },
    { condition: "not_published", passed: rec?.moderationState !== "published" },
    { condition: "privacy_preserved", passed: Boolean(rec?.privacyChoice) },
  ];
}

async function cancelVisitPlan(ctx: AuraCancellationContext): Promise<AuraCancellationResult> {
  const share = [...applicationRecords.visitPlanShares.values()].find(
    (s) => s.missionId === ctx.execution.missionId,
  );
  if (!share) {
    return { state: "not_cancellable", message: "No share grant found." };
  }
  applicationRecords.visitPlanShares.set(share.id, {
    ...share,
    revokedAt: new Date().toISOString(),
  });
  return { state: "cancelled", message: "Visit Plan share revoked.", compensationOffered: false };
}

async function cancelTransport(ctx: AuraCancellationContext): Promise<AuraCancellationResult> {
  const req = applicationRecords.transportRequests.get(
    ctx.execution.applicationReceiptId ?? "",
  );
  if (!req || req.status === "cancelled") {
    return { state: "not_cancellable", message: "Transport request cannot be cancelled in this state." };
  }
  applicationRecords.transportRequests.set(req.id, { ...req, status: "cancelled" });
  return { state: "cancelled", message: "Transport request cancelled through transport service." };
}

export type AuraExecutionServiceDefinition = {
  actionType: AuraProposalActionType;
  serviceId: string;
  serviceVersion: string;
  requiredPermission: string;
  requiredConsentScopes: string[];
  supportsIdempotency: boolean;
  supportsCancellation: boolean;
  supportsCompensation: boolean;
  adapterDependency?: string;
  preflight: (context: AuraExecutionContext) => Promise<AuraServicePreflight>;
  execute: (context: AuraAuthorisedExecutionContext) => Promise<AuraServiceReceipt>;
  verifyPostconditions: (
    context: AuraPostconditionContext,
  ) => Promise<{ condition: string; passed: boolean; evidenceReference?: string }[]>;
  cancel?: (context: AuraCancellationContext) => Promise<AuraCancellationResult>;
  compensate?: (context: AuraCompensationContext) => Promise<AuraCompensationResult>;
};

export const EXECUTION_SERVICE_REGISTRY: Record<
  AuraProposalActionType,
  AuraExecutionServiceDefinition
> = {
  venue_verification_request: {
    actionType: "venue_verification_request",
    serviceId: "accessIntelligenceMessagingService",
    serviceVersion: "1.0.0",
    requiredPermission: "access.message_venue",
    requiredConsentScopes: ["access.venue_message"],
    supportsIdempotency: true,
    supportsCancellation: true,
    supportsCompensation: true,
    adapterDependency: "messaging",
    preflight: preflightVenue,
    execute: executeVenue,
    verifyPostconditions: verifyVenuePost,
  },
  visit_plan_share: {
    actionType: "visit_plan_share",
    serviceId: "visitPlanSharingService",
    serviceVersion: "1.0.0",
    requiredPermission: "access.share_plan",
    requiredConsentScopes: ["access.share_visit_plan"],
    supportsIdempotency: true,
    supportsCancellation: true,
    supportsCompensation: true,
    preflight: preflightVisitPlan,
    execute: executeVisitPlan,
    verifyPostconditions: verifyVisitPlanPost,
    cancel: cancelVisitPlan,
  },
  supporter_notification: {
    actionType: "supporter_notification",
    serviceId: "notificationService",
    serviceVersion: "1.0.0",
    requiredPermission: "care.notify_supporter",
    requiredConsentScopes: ["care.supporter_notification"],
    supportsIdempotency: true,
    supportsCancellation: false,
    supportsCompensation: true,
    adapterDependency: "messaging",
    preflight: preflightSupporter,
    execute: executeSupporter,
    verifyPostconditions: verifySupporterPost,
  },
  transport_request: {
    actionType: "transport_request",
    serviceId: "transportTripService",
    serviceVersion: "1.0.0",
    requiredPermission: "transport.create_request",
    requiredConsentScopes: ["transport.pickup_address"],
    supportsIdempotency: true,
    supportsCancellation: true,
    supportsCompensation: false,
    preflight: preflightTransport,
    execute: executeTransport,
    verifyPostconditions: verifyTransportPost,
    cancel: cancelTransport,
  },
  barrier_report: {
    actionType: "barrier_report",
    serviceId: "accessBarrierReportService",
    serviceVersion: "1.0.0",
    requiredPermission: "access.submit_barrier",
    requiredConsentScopes: ["access.barrier_report"],
    supportsIdempotency: true,
    supportsCancellation: true,
    supportsCompensation: true,
    preflight: preflightBarrier,
    execute: executeBarrier,
    verifyPostconditions: verifyBarrierPost,
  },
};

export function resolveExecutionService(
  actionType: AuraProposalActionType,
  clientServiceId?: string,
): AuraExecutionServiceDefinition {
  if (clientServiceId) {
    throw new Error("AURA_CLIENT_SERVICE_ID_FORBIDDEN");
  }
  const def = EXECUTION_SERVICE_REGISTRY[actionType];
  if (!def) throw new Error("AURA_EXECUTION_SERVICE_UNREGISTERED");
  return def;
}
