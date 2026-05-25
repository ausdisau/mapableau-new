import type { CareRequestType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { syncCalendarForCareRequest } from "@/lib/calendar/calendar-service";
import { checkConsent } from "@/lib/consent/consent-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import { createCareBookingForRequest } from "@/lib/care/care-booking-service";

export async function createCareRequest(params: {
  participantId: string;
  createdById: string;
  requestType: CareRequestType;
  title: string;
  description: string;
  preferredDate?: Date;
  startTime?: string;
  endTime?: string;
  address?: string;
  suburb?: string;
  state?: string;
  accessRequirementsSummary?: string;
  linkedTransportRequired?: boolean;
  shareAccessibility?: boolean;
  shareAccessibilityConfirmed?: boolean;
  fundingSourceId?: string;
  tasks?: unknown[];
}) {
  if (
    params.shareAccessibility &&
    params.shareAccessibilityConfirmed &&
    params.accessRequirementsSummary
  ) {
    const hasConsent = await checkConsent({
      subjectUserId: params.participantId,
      scope: "care.accessibility_share",
    });
    if (!hasConsent) {
      throw new Error("CONSENT_REQUIRED");
    }
  }

  const request = await prisma.careRequest.create({
    data: {
      participantId: params.participantId,
      createdById: params.createdById,
      requestType: params.requestType,
      title: params.title,
      description: params.description,
      preferredDate: params.preferredDate,
      startTime: params.startTime,
      endTime: params.endTime,
      address: params.address,
      suburb: params.suburb,
      state: params.state,
      accessRequirementsSummary: params.shareAccessibility
        ? params.accessRequirementsSummary
        : undefined,
      linkedTransportRequired: params.linkedTransportRequired ?? false,
      shareAccessibility: params.shareAccessibility ?? false,
      fundingSourceId: params.fundingSourceId,
      tasks: (params.tasks ?? []) as object,
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "care_request.created",
    entityType: "CareRequest",
    entityId: request.id,
    participantId: params.participantId,
  });

  return request;
}

export async function submitCareRequest(
  careRequestId: string,
  actorUserId: string
) {
  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: { status: "submitted" },
  });

  await syncCalendarForCareRequest(request);
  await createAuditEvent({
    actorUserId,
    action: "care_request.submitted",
    entityType: "CareRequest",
    entityId: request.id,
    participantId: request.participantId,
  });

  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });
  for (const a of admins) {
    await notifyUser(a.id, "booking", "Care request submitted", request.title);
  }

  return request;
}

export async function assignCareRequestProvider(
  careRequestId: string,
  organisationId: string,
  adminUserId: string
) {
  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: {
      assignedOrganisationId: organisationId,
      status: "awaiting_provider_response",
    },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "care_request.assigned",
    entityType: "CareRequest",
    entityId: careRequestId,
    organisationId,
    participantId: request.participantId,
  });

  return request;
}

export async function providerAcceptCareRequest(
  careRequestId: string,
  actorUserId: string
) {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!request.assignedOrganisationId) throw new Error("ORGANISATION_REQUIRED");
  await assertProviderOrgAccess(
    { id: actorUserId, email: "", name: "", phone: null, timezone: "Australia/Sydney", locale: "en-AU", primaryRole: "provider_admin", roles: ["provider_admin"] },
    request.assignedOrganisationId
  );
  const careBooking = await createCareBookingForRequest({
    careRequestId,
    actorUserId,
  });

  if (request.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: request.bookingId,
      eventType: "provider_accepted",
      title: "Care provider accepted request",
      actorUserId,
    });
  }

  await notifyUser(
    request.participantId,
    "booking",
    "Care request confirmed",
    "Your care provider has accepted your request."
  );

  return { request, careBooking };
}

export async function providerDeclineCareRequest(
  careRequestId: string,
  actorUserId: string,
  note?: string
) {
  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: { status: "cancelled" },
  });
  await createAuditEvent({
    actorUserId,
    action: "care_request.provider_declined",
    entityType: "CareRequest",
    entityId: request.id,
    organisationId: request.assignedOrganisationId,
    participantId: request.participantId,
    metadata: note ? { note } : undefined,
  });
  return request;
}
