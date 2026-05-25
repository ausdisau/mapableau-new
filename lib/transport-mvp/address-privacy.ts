import type { TransportTripStop } from "@prisma/client";

export type TransportAddressViewerRole =
  | "participant"
  | "provider_org"
  | "assigned_driver"
  | "other";

export type RedactedStop = {
  id: string;
  sequence: number;
  stopType: string;
  address: string;
  addressSuburb: string | null;
  lat: number | null;
  lng: number | null;
  scheduledAt: Date | null;
  notes: string | null;
  redacted: boolean;
};

export function resolveAddressViewerRole(params: {
  viewerUserId: string;
  participantId: string;
  organisationId: string;
  viewerOrgIds: string[];
  assignedDriverUserId?: string | null;
}): TransportAddressViewerRole {
  if (params.viewerUserId === params.participantId) return "participant";
  if (params.assignedDriverUserId && params.viewerUserId === params.assignedDriverUserId) {
    return "assigned_driver";
  }
  if (params.viewerOrgIds.includes(params.organisationId)) return "provider_org";
  return "other";
}

export function redactStopAddress(
  stop: Pick<
    TransportTripStop,
    | "id"
    | "sequence"
    | "stopType"
    | "addressFull"
    | "addressSuburb"
    | "lat"
    | "lng"
    | "scheduledAt"
    | "notes"
  >,
  viewerRole: TransportAddressViewerRole
): RedactedStop {
  const canSeeFull =
    viewerRole === "participant" ||
    viewerRole === "provider_org" ||
    viewerRole === "assigned_driver";

  if (canSeeFull) {
    return {
      id: stop.id,
      sequence: stop.sequence,
      stopType: stop.stopType,
      address: stop.addressFull,
      addressSuburb: stop.addressSuburb,
      lat: stop.lat,
      lng: stop.lng,
      scheduledAt: stop.scheduledAt,
      notes: stop.notes,
      redacted: false,
    };
  }

  const suburb = stop.addressSuburb ?? "Location";
  return {
    id: stop.id,
    sequence: stop.sequence,
    stopType: stop.stopType,
    address: `${suburb} area — full address available to assigned provider and driver`,
    addressSuburb: stop.addressSuburb,
    lat: null,
    lng: null,
    scheduledAt: stop.scheduledAt,
    notes: null,
    redacted: true,
  };
}

export function getStopsForViewer(
  stops: TransportTripStop[],
  viewerRole: TransportAddressViewerRole
): RedactedStop[] {
  return stops
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((s) => redactStopAddress(s, viewerRole));
}
