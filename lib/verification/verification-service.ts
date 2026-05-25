import type {
  VerificationEligibilityGate,
  VerificationRecordStatus,
  VerificationRecordType,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { setBookingEligibility } from "@/lib/providers/provider-org-profile-service";
import { prisma } from "@/lib/prisma";

export function isVerificationCurrent(input: {
  status: VerificationRecordStatus;
  expiryDate?: Date | null;
}) {
  if (input.status !== "verified") return false;
  if (!input.expiryDate) return true;
  return input.expiryDate > new Date();
}

export async function upsertVerificationRecord(params: {
  subjectType: string;
  subjectId: string;
  recordType: VerificationRecordType;
  actorUserId: string;
  organisationId?: string;
  profileId?: string;
  eligibilityGate?: VerificationEligibilityGate;
  expiryDate?: Date;
  notes?: string;
}) {
  const existing = await prisma.verificationRecord.findFirst({
    where: {
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      recordType: params.recordType,
    },
  });

  const record = existing
    ? await prisma.verificationRecord.update({
        where: { id: existing.id },
        data: {
          organisationId: params.organisationId,
          profileId: params.profileId,
          eligibilityGate: params.eligibilityGate,
          expiryDate: params.expiryDate,
          notes: params.notes,
          events: {
            create: {
              eventType: "updated",
              actorUserId: params.actorUserId,
              note: params.notes,
            },
          },
        },
      })
    : await prisma.verificationRecord.create({
        data: {
          subjectType: params.subjectType,
          subjectId: params.subjectId,
          recordType: params.recordType,
          organisationId: params.organisationId,
          profileId: params.profileId,
          eligibilityGate: params.eligibilityGate,
          expiryDate: params.expiryDate,
          notes: params.notes,
          events: {
            create: {
              eventType: "created",
              actorUserId: params.actorUserId,
              note: params.notes,
            },
          },
        },
      });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "verification.record_upserted",
    entityType: "verification_records",
    entityId: record.id,
    organisationId: params.organisationId,
    metadata: { recordType: params.recordType },
  });

  return record;
}

export async function reviewVerificationRecord(params: {
  recordId: string;
  status: VerificationRecordStatus;
  actorUserId: string;
  notes?: string;
}) {
  const record = await prisma.verificationRecord.update({
    where: { id: params.recordId },
    data: {
      status: params.status,
      reviewedById: params.actorUserId,
      reviewedAt: new Date(),
      notes: params.notes,
      events: {
        create: {
          eventType: `review_${params.status}`,
          actorUserId: params.actorUserId,
          note: params.notes,
        },
      },
    },
  });

  if (
    record.eligibilityGate === "provider_booking_eligibility" &&
    record.organisationId &&
    isVerificationCurrent(record)
  ) {
    await setBookingEligibility(
      record.organisationId,
      "eligible",
      params.actorUserId
    );
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "verification.reviewed",
    entityType: "verification_records",
    entityId: record.id,
    organisationId: record.organisationId,
    metadata: { status: params.status },
  });

  return record;
}

export async function listExpiringVerificationRecords(days = 30) {
  const until = new Date();
  until.setDate(until.getDate() + days);

  return prisma.verificationRecord.findMany({
    where: {
      status: "verified",
      expiryDate: {
        not: null,
        lte: until,
      },
    },
    orderBy: { expiryDate: "asc" },
    take: 100,
  });
}

export async function getEligibilityGateStatus(params: {
  subjectType: string;
  subjectId: string;
  gate: VerificationEligibilityGate;
}) {
  const records = await prisma.verificationRecord.findMany({
    where: {
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      eligibilityGate: params.gate,
    },
  });

  if (records.length === 0) return "not_started" as const;
  if (records.every(isVerificationCurrent)) return "eligible" as const;
  if (records.some((record) => record.status === "rejected")) {
    return "blocked" as const;
  }
  return "pending_review" as const;
}
