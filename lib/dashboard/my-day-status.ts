/**
 * Deterministic My Day status derivation — no fabricated schedules.
 */

export type Certainty = "confirmed" | "pending" | "cancelled" | "unknown";

export type ContextualActivity = {
  id: string;
  kind: "care" | "transport" | "booking";
  title: string;
  status: Certainty;
  rawStatus: string;
  startsAt: string | null;
  href: string;
  certaintyNote: string;
};

export type MyDaySnapshot = {
  generatedAt: string;
  nearestConfirmed: ContextualActivity | null;
  pendingActions: ContextualActivity[];
  careSummary: {
    status: Certainty;
    label: string;
    count: number;
    href: string;
  };
  transportSummary: {
    status: Certainty;
    label: string;
    count: number;
    href: string;
  };
  empty: boolean;
  source: "programmatic";
};

const CARE_CONFIRMED = new Set([
  "accepted",
  "worker_assigned",
  "in_progress",
  "completed",
]);
const CARE_PENDING = new Set(["pending_provider", "disputed"]);
const CARE_CANCELLED = new Set(["cancelled", "declined"]);

const TRANSPORT_CONFIRMED = new Set([
  "accepted",
  "dispatch_pending",
  "driver_vehicle_assigned",
  "driver_accepted",
  "pre_start_check_required",
  "en_route_to_pickup",
  "arrived_at_pickup",
  "participant_boarded",
  "en_route_to_dropoff",
  "arrived_at_dropoff",
  "handover_completed",
  "trip_completed",
  "evidence_submitted",
  "participant_review",
  "closed",
]);
const TRANSPORT_PENDING = new Set([
  "requested",
  "provider_review",
  "disputed",
  "service_recovery_required",
]);
const TRANSPORT_CANCELLED = new Set([
  "cancelled",
  "declined",
  "driver_no_show",
  "participant_no_show",
  "handover_failed",
  "unsafe_to_continue",
]);

export function mapCareStatus(raw: string): Certainty {
  if (CARE_CONFIRMED.has(raw)) return "confirmed";
  if (CARE_PENDING.has(raw)) return "pending";
  if (CARE_CANCELLED.has(raw)) return "cancelled";
  return "unknown";
}

export function mapTransportStatus(raw: string): Certainty {
  if (TRANSPORT_CONFIRMED.has(raw)) return "confirmed";
  if (TRANSPORT_PENDING.has(raw)) return "pending";
  if (TRANSPORT_CANCELLED.has(raw)) return "cancelled";
  return "unknown";
}

export function certaintyLabel(status: Certainty): string {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Awaiting confirmation";
    case "cancelled":
      return "Cancelled";
    case "unknown":
      return "Status unknown";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function careCertaintyNote(status: Certainty): string {
  if (status === "confirmed") {
    return "Confirmed from your authorised care booking record.";
  }
  if (status === "pending") {
    return "Not yet confirmed by a provider — this is not a booked visit.";
  }
  if (status === "cancelled") {
    return "This care visit was cancelled. Transport is unchanged unless you confirm a linked change.";
  }
  return "Care status could not be verified from available records.";
}

function transportCertaintyNote(status: Certainty): string {
  if (status === "confirmed") {
    return "Confirmed from your authorised transport trip record.";
  }
  if (status === "pending") {
    return "Transport is awaiting confirmation — not described as booked.";
  }
  if (status === "cancelled") {
    return "This transport trip was cancelled or could not proceed.";
  }
  return "Transport status could not be verified from available records.";
}

export type CareRow = {
  id: string;
  status: string;
  title?: string | null;
  scheduledStartAt?: Date | null;
};

export type TransportRow = {
  id: string;
  status: string;
  scheduledStart?: Date | null;
};

export function buildMyDaySnapshot(input: {
  now?: Date;
  care: CareRow[];
  transport: TransportRow[];
}): MyDaySnapshot {
  const now = input.now ?? new Date();
  const activities: ContextualActivity[] = [
    ...input.care.map((row) => {
      const status = mapCareStatus(row.status);
      return {
        id: `care-${row.id}`,
        kind: "care" as const,
        title: row.title?.trim() || "Care booking",
        status,
        rawStatus: row.status,
        startsAt: row.scheduledStartAt?.toISOString() ?? null,
        href: `/care/bookings`,
        certaintyNote: careCertaintyNote(status),
      };
    }),
    ...input.transport.map((row) => {
      const status = mapTransportStatus(row.status);
      return {
        id: `transport-${row.id}`,
        kind: "transport" as const,
        title: "Transport trip",
        status,
        rawStatus: row.status,
        startsAt: row.scheduledStart?.toISOString() ?? null,
        href: `/dashboard/transport`,
        certaintyNote: transportCertaintyNote(status),
      };
    }),
  ];

  const upcomingConfirmed = activities
    .filter((a) => a.status === "confirmed" && a.startsAt)
    .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!))
    .find((a) => Date.parse(a.startsAt!) >= now.getTime() - 60 * 60 * 1000);

  const pendingActions = activities.filter((a) => a.status === "pending");

  const carePending = activities.filter(
    (a) => a.kind === "care" && a.status === "pending",
  ).length;
  const careCancelled = activities.filter(
    (a) => a.kind === "care" && a.status === "cancelled",
  ).length;
  const careConfirmed = activities.filter(
    (a) => a.kind === "care" && a.status === "confirmed",
  ).length;

  const transportPending = activities.filter(
    (a) => a.kind === "transport" && a.status === "pending",
  ).length;
  const transportCancelled = activities.filter(
    (a) => a.kind === "transport" && a.status === "cancelled",
  ).length;
  const transportConfirmed = activities.filter(
    (a) => a.kind === "transport" && a.status === "confirmed",
  ).length;

  const careSummaryStatus: Certainty =
    careCancelled > 0 && careConfirmed === 0 && carePending === 0
      ? "cancelled"
      : carePending > 0
        ? "pending"
        : careConfirmed > 0
          ? "confirmed"
          : activities.some((a) => a.kind === "care")
            ? "unknown"
            : "unknown";

  const transportSummaryStatus: Certainty =
    transportCancelled > 0 &&
    transportConfirmed === 0 &&
    transportPending === 0
      ? "cancelled"
      : transportPending > 0
        ? "pending"
        : transportConfirmed > 0
          ? "confirmed"
          : activities.some((a) => a.kind === "transport")
            ? "unknown"
            : "unknown";

  return {
    generatedAt: now.toISOString(),
    nearestConfirmed: upcomingConfirmed ?? null,
    pendingActions,
    careSummary: {
      status: careSummaryStatus,
      label:
        input.care.length === 0
          ? "No care bookings on record"
          : `${certaintyLabel(careSummaryStatus)} · ${input.care.length} recent`,
      count: input.care.length,
      href: "/care/bookings",
    },
    transportSummary: {
      status: transportSummaryStatus,
      label:
        input.transport.length === 0
          ? "No transport trips on record"
          : `${certaintyLabel(transportSummaryStatus)} · ${input.transport.length} recent`,
      count: input.transport.length,
      href: "/dashboard/transport",
    },
    empty: activities.length === 0,
    source: "programmatic",
  };
}
