import type { CurrentUser } from "@/lib/auth/current-user";
import { parseShiftQuery } from "@/lib/care/shift-creator/parse-shift-query";
import { resolveCareBooking } from "@/lib/care/shift-creator/resolve-booking";
import {
  listOrgWorkers,
  resolveWorkerFromParse,
} from "@/lib/care/shift-creator/resolve-worker";
import type {
  ShiftCreatorDraft,
  ShiftCreatorStreamEvent,
  ShiftCreatorStreamResult,
  ShiftEligibilityPreview,
} from "@/lib/care/shift-creator/types";
import {
  assertWorkerEligibleForBooking,
  loadWorkerForEligibility,
} from "@/lib/care/worker-eligibility";

type StreamParams = {
  query: string;
  careBookingId?: string;
  actorUser: CurrentUser;
  onEvent?: (event: ShiftCreatorStreamEvent) => void | Promise<void>;
};

const ELIGIBILITY_MESSAGES: Record<string, string> = {
  WORKER_INACTIVE: "This worker is not active.",
  WORKER_ORG_MISMATCH: "This worker belongs to another organisation.",
  WORKER_NOT_VERIFIED: "This worker is not verified.",
  WORKER_SCREENING_REQUIRED: "Worker screening must be completed first.",
  HIGH_INTENSITY_COMPETENCY_REQUIRED:
    "This booking needs a worker with high-intensity competency.",
  WORKER_NOT_FOUND: "Worker profile not found.",
};

export async function runShiftCreatorStream({
  query,
  careBookingId,
  actorUser,
  onEvent,
}: StreamParams): Promise<ShiftCreatorStreamResult> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error("Please describe the shift you want to create.");
  }

  await emit(onEvent, {
    stage: "received_query",
    message: "Received your shift request.",
    payload: { query: normalizedQuery },
  });

  const preParse = parseShiftQuery(normalizedQuery, []);
  const bookingResolution = await resolveCareBooking({
    actorUser,
    query: normalizedQuery,
    careBookingId,
    titleHint: preParse.bookingTitleHint,
  });

  const warnings = [...bookingResolution.warnings];

  if (!bookingResolution.booking) {
    await emit(onEvent, {
      stage: "resolved_booking",
      message: bookingResolution.ambiguous.length
        ? "Several bookings could match — please clarify."
        : "Could not resolve a care booking.",
      payload: {
        ambiguousCount: bookingResolution.ambiguous.length,
      },
    });

    const emptyDraft = buildPlaceholderDraft();
    await emit(onEvent, { stage: "draft_ready", message: "Draft needs a booking." });
    await emit(onEvent, { stage: "finalized", message: "Shift plan incomplete." });

    return {
      draft: emptyDraft,
      warnings,
      suggestedActions: [
        "Include the booking title in your message",
        "Open shift creator from a specific booking page",
        ...(bookingResolution.ambiguous.length
          ? ["Pick one of the listed bookings below"]
          : []),
      ],
      ambiguousBookings: bookingResolution.ambiguous,
    };
  }

  const booking = bookingResolution.booking;

  await emit(onEvent, {
    stage: "resolved_booking",
    message: `Using booking: ${booking.title}.`,
    payload: {
      careBookingId: booking.id,
      title: booking.title,
      status: booking.status,
    },
  });

  const workers = await listOrgWorkers(booking.organisationId);
  const parsed = parseShiftQuery(normalizedQuery, workers);
  warnings.push(...parsed.warnings);

  const startAt =
    parsed.startAt ??
    booking.scheduledStartAt ??
    new Date();
  const endAt =
    parsed.endAt ??
    booking.scheduledEndAt ??
    new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
  const location = parsed.location ?? booking.location ?? undefined;

  await emit(onEvent, {
    stage: "parsed_shift_details",
    message: `Shift window ${formatWindow(startAt, endAt)}.`,
    payload: {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      location,
    },
  });

  const workerMatch = resolveWorkerFromParse(parsed, workers);
  warnings.push(...workerMatch.warnings);

  if (workerMatch.workerProfileId) {
    await emit(onEvent, {
      stage: "matched_worker",
      message: `Matched worker: ${workerMatch.workerDisplayName}.`,
      payload: {
        workerProfileId: workerMatch.workerProfileId,
        workerDisplayName: workerMatch.workerDisplayName,
      },
    });
  } else {
    await emit(onEvent, {
      stage: "matched_worker",
      message: "No worker matched yet — select one before confirming.",
      payload: { workerCount: workers.length },
    });
  }

  const eligibility = await previewEligibility(
    workerMatch.workerProfileId,
    booking.organisationId,
    booking.tasks,
  );

  await emit(onEvent, {
    stage: "checked_eligibility",
    message: eligibility.ok
      ? "Worker passes eligibility checks for this booking."
      : (eligibility.message ?? "Worker is not eligible for this booking."),
    payload: eligibility,
  });

  const draft: ShiftCreatorDraft = {
    careBookingId: booking.id,
    careRequestId: booking.careRequestId,
    organisationId: booking.organisationId,
    bookingTitle: booking.title,
    workerProfileId: workerMatch.workerProfileId,
    workerDisplayName: workerMatch.workerDisplayName,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    location,
    eligibility,
  };

  await emit(onEvent, {
    stage: "draft_ready",
    message: "Shift draft is ready for your review.",
    payload: { careBookingId: draft.careBookingId },
  });

  const suggestedActions: string[] = [];
  if (!draft.workerProfileId) {
    suggestedActions.push("Select a worker from the list");
  }
  if (!eligibility.ok && draft.workerProfileId) {
    suggestedActions.push("Choose a different worker");
  }
  if (eligibility.ok && draft.workerProfileId) {
    suggestedActions.push("Confirm to assign worker and create the shift");
  }

  await emit(onEvent, {
    stage: "finalized",
    message: "Shift planning complete.",
  });

  return {
    draft,
    warnings,
    suggestedActions,
    availableWorkers: workers,
  };
}

async function previewEligibility(
  workerProfileId: string | undefined,
  organisationId: string,
  tasks: unknown,
): Promise<ShiftEligibilityPreview> {
  if (!workerProfileId) {
    return { ok: false, code: "WORKER_REQUIRED", message: "Select a worker." };
  }

  try {
    const worker = await loadWorkerForEligibility(workerProfileId);
    assertWorkerEligibleForBooking(worker, { organisationId, tasks });
    return { ok: true };
  } catch (e) {
    const code = e instanceof Error ? e.message : "UNKNOWN";
    return {
      ok: false,
      code,
      message: ELIGIBILITY_MESSAGES[code] ?? "Worker cannot be assigned.",
    };
  }
}

function buildPlaceholderDraft(): ShiftCreatorDraft {
  const now = new Date();
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    careBookingId: "",
    careRequestId: "",
    organisationId: "",
    bookingTitle: "",
    startAt: now.toISOString(),
    endAt: end.toISOString(),
    eligibility: { ok: false, message: "Booking required." },
  };
}

function formatWindow(start: Date, end: Date): string {
  return `${start.toLocaleString()} – ${end.toLocaleString()}`;
}

async function emit(
  onEvent: StreamParams["onEvent"],
  event: ShiftCreatorStreamEvent,
) {
  await onEvent?.(event);
}
