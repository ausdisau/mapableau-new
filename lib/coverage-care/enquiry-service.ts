import type { CurrentUser } from "@/lib/auth/current-user";
import {
  coverageCareConfig,
  ensureCoverageCareEnabled,
} from "@/lib/config/coverage-care";
import {
  grantEnquiryShareConsent,
  recordCoverageCareAudit,
  revokeEnquiryShareConsent,
} from "@/lib/coverage-care/core-bridge";
import { getCoverageCareListing } from "@/lib/coverage-care/listing-service";
import {
  assertEnquiryParticipant,
  assertProviderTenantAdmin,
  assertSameTenant,
  canReadProviderInbox,
  CoverageCarePermissionError,
} from "@/lib/coverage-care/permissions";
import {
  getCoverageCareMemoryState,
  memoryCreateId,
  memoryNow,
} from "@/lib/coverage-care/store/memory-store";
import {
  getCoverageCareTenant,
  recordAccessDenial,
} from "@/lib/coverage-care/tenant-context";
import type {
  CoverageCareEnquiry,
  CoverageCareSharePreview,
} from "@/lib/coverage-care/types";

function shouldUseSyntheticConsent() {
  return coverageCareConfig.persistence === "memory";
}

function requireTenantMatch(input: {
  actorUserId: string;
  actorTenantId: string;
  resourceTenantId: string;
  resourceType: string;
  resourceId?: string;
}) {
  try {
    assertSameTenant(input.actorTenantId, input.resourceTenantId);
  } catch (error) {
    recordAccessDenial({
      actorUserId: input.actorUserId,
      attemptedTenantId: input.actorTenantId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      reason: "CROSS_TENANT_DENIED",
    });
    throw error;
  }
}

export function createCoverageCareEnquiry(input: {
  participant: CurrentUser;
  tenantId?: string;
  listingId?: string | null;
}): CoverageCareEnquiry {
  ensureCoverageCareEnabled();
  const tenant = getCoverageCareTenant();
  const tenantId = input.tenantId ?? tenant.id;

  if (input.listingId) {
    const listing = getCoverageCareListing(input.listingId, tenantId);
    if (!listing) {
      throw new CoverageCarePermissionError(
        "Listing not found in this tenant.",
        "TENANT_MISMATCH",
      );
    }
  }

  const ts = memoryNow();
  const enquiry: CoverageCareEnquiry = {
    id: memoryCreateId("enq"),
    tenantId,
    participantUserId: input.participant.id,
    listingId: input.listingId ?? null,
    status: "draft",
    sharePreview: null,
    consentRecordId: null,
    providerNotes: null,
    withdrawnAt: null,
    deletedAt: null,
    createdAt: ts,
    updatedAt: ts,
  };

  getCoverageCareMemoryState().enquiries.push(enquiry);
  void recordCoverageCareAudit({
    actorUserId: input.participant.id,
    action: "coverage_care.enquiry.created",
    entityType: "CoverageCareEnquiry",
    entityId: enquiry.id,
    participantId: input.participant.id,
    metadata: { tenantId, listingId: enquiry.listingId },
  });
  return { ...enquiry };
}

export function updateEnquirySharePreview(input: {
  enquiryId: string;
  participant: CurrentUser;
  actorTenantId?: string;
  sharePreview: CoverageCareSharePreview;
}): CoverageCareEnquiry {
  ensureCoverageCareEnabled();
  const state = getCoverageCareMemoryState();
  const enquiry = state.enquiries.find((item) => item.id === input.enquiryId);
  if (!enquiry || enquiry.deletedAt) {
    throw new Error("ENQUIRY_NOT_FOUND");
  }

  assertEnquiryParticipant(input.participant, enquiry);
  if (input.actorTenantId) {
    requireTenantMatch({
      actorUserId: input.participant.id,
      actorTenantId: input.actorTenantId,
      resourceTenantId: enquiry.tenantId,
      resourceType: "CoverageCareEnquiry",
      resourceId: enquiry.id,
    });
  }

  if (enquiry.status !== "draft" && enquiry.status !== "sharing_review") {
    throw new Error("ENQUIRY_NOT_EDITABLE");
  }

  enquiry.sharePreview = { ...input.sharePreview };
  enquiry.status = "sharing_review";
  enquiry.updatedAt = memoryNow();

  void recordCoverageCareAudit({
    actorUserId: input.participant.id,
    action: "coverage_care.enquiry.share_reviewed",
    entityType: "CoverageCareEnquiry",
    entityId: enquiry.id,
    participantId: enquiry.participantUserId,
  });

  return { ...enquiry };
}

export async function submitCoverageCareEnquiry(input: {
  enquiryId: string;
  participant: CurrentUser;
  actorTenantId?: string;
}): Promise<CoverageCareEnquiry> {
  ensureCoverageCareEnabled();
  const state = getCoverageCareMemoryState();
  const enquiry = state.enquiries.find((item) => item.id === input.enquiryId);
  if (!enquiry || enquiry.deletedAt) {
    throw new Error("ENQUIRY_NOT_FOUND");
  }

  assertEnquiryParticipant(input.participant, enquiry);
  if (input.actorTenantId) {
    requireTenantMatch({
      actorUserId: input.participant.id,
      actorTenantId: input.actorTenantId,
      resourceTenantId: enquiry.tenantId,
      resourceType: "CoverageCareEnquiry",
      resourceId: enquiry.id,
    });
  }

  if (enquiry.status !== "sharing_review" && enquiry.status !== "draft") {
    throw new Error("ENQUIRY_NOT_SUBMITTABLE");
  }
  if (!enquiry.sharePreview) {
    throw new Error("SHARE_PREVIEW_REQUIRED");
  }

  const tenant = getCoverageCareTenant();
  const { consentRecordId } = await grantEnquiryShareConsent({
    participant: input.participant,
    organisationId: tenant.organisationId,
    purpose: enquiry.sharePreview.purpose,
    useSynthetic: shouldUseSyntheticConsent(),
  });

  enquiry.consentRecordId = consentRecordId;
  enquiry.status = "submitted";
  enquiry.updatedAt = memoryNow();

  void recordCoverageCareAudit({
    actorUserId: input.participant.id,
    action: "coverage_care.enquiry.submitted",
    entityType: "CoverageCareEnquiry",
    entityId: enquiry.id,
    participantId: enquiry.participantUserId,
    metadata: { consentRecordId, synthetic: true },
  });

  return { ...enquiry };
}

export function markEnquiryProviderReviewed(input: {
  enquiryId: string;
  actor: CurrentUser;
  actorTenantId: string;
  notes?: string;
}): CoverageCareEnquiry {
  ensureCoverageCareEnabled();
  const state = getCoverageCareMemoryState();
  const enquiry = state.enquiries.find((item) => item.id === input.enquiryId);
  if (!enquiry || enquiry.deletedAt) {
    throw new Error("ENQUIRY_NOT_FOUND");
  }

  assertProviderTenantAdmin(input.actor, input.actorTenantId, enquiry.tenantId);

  if (enquiry.status !== "submitted" && enquiry.status !== "provider_reviewed") {
    throw new Error("ENQUIRY_NOT_IN_INBOX");
  }

  enquiry.status = "provider_reviewed";
  enquiry.providerNotes = input.notes?.trim() || enquiry.providerNotes;
  enquiry.updatedAt = memoryNow();

  void recordCoverageCareAudit({
    actorUserId: input.actor.id,
    action: "coverage_care.enquiry.provider_reviewed",
    entityType: "CoverageCareEnquiry",
    entityId: enquiry.id,
    participantId: enquiry.participantUserId,
  });

  return { ...enquiry };
}

export async function withdrawCoverageCareEnquiry(input: {
  enquiryId: string;
  participant: CurrentUser;
  actorTenantId?: string;
}): Promise<CoverageCareEnquiry> {
  ensureCoverageCareEnabled();
  const state = getCoverageCareMemoryState();
  const enquiry = state.enquiries.find((item) => item.id === input.enquiryId);
  if (!enquiry || enquiry.deletedAt) {
    throw new Error("ENQUIRY_NOT_FOUND");
  }

  assertEnquiryParticipant(input.participant, enquiry);
  if (input.actorTenantId) {
    requireTenantMatch({
      actorUserId: input.participant.id,
      actorTenantId: input.actorTenantId,
      resourceTenantId: enquiry.tenantId,
      resourceType: "CoverageCareEnquiry",
      resourceId: enquiry.id,
    });
  }

  if (enquiry.status === "withdrawn" || enquiry.status === "deleted") {
    throw new Error("ENQUIRY_ALREADY_CLOSED");
  }

  if (enquiry.consentRecordId) {
    await revokeEnquiryShareConsent({
      consentRecordId: enquiry.consentRecordId,
      revokedById: input.participant.id,
      useSynthetic: shouldUseSyntheticConsent(),
    });
  }

  enquiry.status = "withdrawn";
  enquiry.withdrawnAt = memoryNow();
  enquiry.updatedAt = enquiry.withdrawnAt;

  void recordCoverageCareAudit({
    actorUserId: input.participant.id,
    action: "coverage_care.enquiry.withdrawn",
    entityType: "CoverageCareEnquiry",
    entityId: enquiry.id,
    participantId: enquiry.participantUserId,
  });

  return { ...enquiry };
}

export async function deleteCoverageCareEnquiry(input: {
  enquiryId: string;
  participant: CurrentUser;
}): Promise<CoverageCareEnquiry> {
  ensureCoverageCareEnabled();
  const state = getCoverageCareMemoryState();
  const enquiry = state.enquiries.find((item) => item.id === input.enquiryId);
  if (!enquiry || enquiry.deletedAt) {
    throw new Error("ENQUIRY_NOT_FOUND");
  }

  assertEnquiryParticipant(input.participant, enquiry);

  if (enquiry.consentRecordId && enquiry.status !== "withdrawn") {
    await revokeEnquiryShareConsent({
      consentRecordId: enquiry.consentRecordId,
      revokedById: input.participant.id,
      useSynthetic: shouldUseSyntheticConsent(),
    });
  }

  enquiry.status = "deleted";
  enquiry.deletedAt = memoryNow();
  enquiry.updatedAt = enquiry.deletedAt;

  void recordCoverageCareAudit({
    actorUserId: input.participant.id,
    action: "coverage_care.enquiry.deleted",
    entityType: "CoverageCareEnquiry",
    entityId: enquiry.id,
    participantId: enquiry.participantUserId,
  });

  return { ...enquiry };
}

export function getCoverageCareEnquiry(
  enquiryId: string,
  opts: { actorTenantId?: string; actorUserId?: string } = {},
): CoverageCareEnquiry | null {
  ensureCoverageCareEnabled();
  const enquiry = getCoverageCareMemoryState().enquiries.find(
    (item) => item.id === enquiryId && !item.deletedAt,
  );
  if (!enquiry) return null;

  if (opts.actorTenantId && opts.actorTenantId !== enquiry.tenantId) {
    if (opts.actorUserId) {
      recordAccessDenial({
        actorUserId: opts.actorUserId,
        attemptedTenantId: opts.actorTenantId,
        resourceType: "CoverageCareEnquiry",
        resourceId: enquiryId,
        reason: "CROSS_TENANT_DENIED",
      });
    }
    throw new CoverageCarePermissionError(
      "Cross-tenant access denied.",
      "TENANT_MISMATCH",
    );
  }

  return { ...enquiry };
}

export function listParticipantEnquiries(
  participantUserId: string,
  tenantId?: string,
): CoverageCareEnquiry[] {
  ensureCoverageCareEnabled();
  const scopedTenantId = tenantId ?? getCoverageCareTenant().id;
  return getCoverageCareMemoryState()
    .enquiries.filter(
      (item) =>
        item.participantUserId === participantUserId &&
        item.tenantId === scopedTenantId &&
        !item.deletedAt,
    )
    .map((item) => ({ ...item }));
}

export function listProviderInbox(input: {
  actor: CurrentUser;
  actorTenantId: string;
}): CoverageCareEnquiry[] {
  ensureCoverageCareEnabled();
  if (!canReadProviderInbox(input.actor)) {
    throw new CoverageCarePermissionError(
      "Provider inbox access denied.",
      "ROLE_REQUIRED",
    );
  }

  return getCoverageCareMemoryState()
    .enquiries.filter(
      (item) =>
        item.tenantId === input.actorTenantId &&
        !item.deletedAt &&
        (item.status === "submitted" || item.status === "provider_reviewed"),
    )
    .map((item) => ({ ...item }));
}
