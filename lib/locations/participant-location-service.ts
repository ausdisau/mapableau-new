import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { syncLocationGeom } from "@/lib/geo/postgis";
import { prisma } from "@/lib/prisma";

export async function listParticipantLocations(participantId: string) {
  return prisma.participantLocation.findMany({
    where: { participantId },
    orderBy: [{ isDefaultPickup: "desc" }, { label: "asc" }],
  });
}

export async function createParticipantLocation(params: {
  participantId: string;
  label: string;
  lat: number;
  lng: number;
  suburb?: string;
  state?: string;
  isDefaultPickup?: boolean;
  notesInternal?: string;
  actorUserId: string;
}) {
  if (params.isDefaultPickup) {
    await prisma.participantLocation.updateMany({
      where: { participantId: params.participantId },
      data: { isDefaultPickup: false },
    });
  }

  const loc = await prisma.participantLocation.create({
    data: {
      participantId: params.participantId,
      label: params.label,
      lat: params.lat,
      lng: params.lng,
      suburb: params.suburb,
      state: params.state,
      visibility: "private",
      isDefaultPickup: params.isDefaultPickup ?? false,
      notesInternal: params.notesInternal,
    },
  });

  await syncLocationGeom("ParticipantLocation", loc.id, loc.lat, loc.lng);

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "location.participant_created",
    entityType: "ParticipantLocation",
    entityId: loc.id,
    participantId: params.participantId,
    metadata: { label: params.label },
  });

  return loc;
}

export async function resolveParticipantLocationCoords(locationId: string) {
  const loc = await prisma.participantLocation.findUnique({
    where: { id: locationId },
  });
  if (!loc) throw new Error("LOCATION_NOT_FOUND");
  return { lat: loc.lat, lng: loc.lng, label: loc.label };
}
