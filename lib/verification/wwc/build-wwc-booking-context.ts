import type { CareRequest, TransportBooking, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  isParticipantUnder18,
} from "@/lib/verification/wwc/wwc-requirement-rules";
import type { WwcBookingContext } from "@/types/wwc-verification";

function textIndicatesKids(text: string): boolean {
  return /\bkids\b|mapable kids|early intervention/i.test(text);
}

function textIndicatesSchool(text: string): boolean {
  return /\bschool\b/i.test(text);
}

export async function buildWwcContextForCareRequest(
  careRequest: CareRequest & {
    participant?: User & {
      participantProfile?: { dateOfBirth: Date | null } | null;
    };
  }
): Promise<WwcBookingContext & { careRequestType: CareRequest["requestType"] }> {
  let participant = careRequest.participant;
  if (!participant?.participantProfile) {
    participant =
      (await prisma.user.findUnique({
        where: { id: careRequest.participantId },
        include: { participantProfile: true },
      })) ?? undefined;
  }

  const dob = participant?.participantProfile?.dateOfBirth ?? null;
  const under18 = isParticipantUnder18(dob);
  const combinedText = `${careRequest.title} ${careRequest.description}`;

  return {
    participantUnder18: under18,
    mapableKids: textIndicatesKids(combinedText),
    schoolTransport:
      careRequest.linkedTransportRequired && textIndicatesSchool(combinedText),
    paediatricTherapy:
      careRequest.requestType === "therapy_assistance" && under18,
    youthEmploymentSupport:
      careRequest.requestType === "employment_support" && under18,
    safeguardingRestrictionActive: false,
    careRequestType: careRequest.requestType,
  };
}

export async function buildWwcContextForTransportBooking(
  transportBooking: TransportBooking
): Promise<WwcBookingContext> {
  const participant = await prisma.user.findUnique({
    where: { id: transportBooking.participantId },
    include: { participantProfile: true },
  });

  const under18 = isParticipantUnder18(
    participant?.participantProfile?.dateOfBirth
  );
  const notes = [
    transportBooking.pickupNotes,
    transportBooking.dropoffNotes,
    transportBooking.pickupAddress,
    transportBooking.dropoffAddress,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    participantUnder18: under18,
    schoolTransport: textIndicatesSchool(notes) || under18,
    mapableKids: textIndicatesKids(notes),
    paediatricTherapy: false,
    youthEmploymentSupport: false,
    safeguardingRestrictionActive: false,
  };
}

export async function resolveWorkerProfileIdForDriver(
  driverProfileId: string
): Promise<string | null> {
  const driver = await prisma.driverProfile.findUnique({
    where: { id: driverProfileId },
    select: { userId: true, organisationId: true },
  });
  if (!driver?.userId) return null;
  const worker = await prisma.workerProfile.findFirst({
    where: { userId: driver.userId, organisationId: driver.organisationId },
    select: { id: true },
  });
  return worker?.id ?? null;
}
