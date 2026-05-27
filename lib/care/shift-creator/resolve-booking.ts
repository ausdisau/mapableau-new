import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import type { ResolvedBooking } from "@/lib/care/shift-creator/types";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

const ASSIGNABLE_STATUSES = [
  "pending_provider",
  "accepted",
  "worker_assigned",
  "in_progress",
] as const;

export type BookingResolution = {
  booking: ResolvedBooking | null;
  ambiguous: { id: string; title: string }[];
  warnings: string[];
};

export async function resolveCareBooking(params: {
  actorUser: CurrentUser;
  query: string;
  careBookingId?: string;
  titleHint?: string;
}): Promise<BookingResolution> {
  const warnings: string[] = [];
  const orgIds = isAdminRole(params.actorUser.primaryRole)
    ? undefined
    : await getUserOrganisationIds(params.actorUser.id);

  if (params.careBookingId) {
    const booking = await prisma.careBooking.findUnique({
      where: { id: params.careBookingId },
      include: { careRequest: { select: { id: true, title: true } } },
    });
    if (!booking) {
      return {
        booking: null,
        ambiguous: [],
        warnings: ["Booking not found."],
      };
    }
    if (orgIds && !orgIds.includes(booking.organisationId)) {
      return {
        booking: null,
        ambiguous: [],
        warnings: ["You do not have access to this booking."],
      };
    }
    await assertProviderOrgAccess(params.actorUser, booking.organisationId);
    return {
      booking: toResolved(booking, 100),
      ambiguous: [],
      warnings,
    };
  }

  const where: Record<string, unknown> = {
    status: { in: [...ASSIGNABLE_STATUSES] },
  };
  if (orgIds) {
    where.organisationId = { in: orgIds };
  }

  const bookings = await prisma.careBooking.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { careRequest: { select: { id: true, title: true } } },
  });

  if (bookings.length === 0) {
    return {
      booking: null,
      ambiguous: [],
      warnings: ["No assignable care bookings found for your organisation."],
    };
  }

  const queryLower = params.query.toLowerCase();
  const hint = params.titleHint?.toLowerCase();

  const scored = bookings
    .map((b) => {
      let score = 0;
      const title = b.careRequest.title.toLowerCase();
      if (queryLower.includes(b.id.toLowerCase())) score += 50;
      if (hint && title.includes(hint)) score += 40;
      if (hint && hint.includes(title)) score += 30;
      const tokens = (hint ?? queryLower).split(/\s+/).filter((t) => t.length > 3);
      for (const token of tokens) {
        if (title.includes(token)) score += 10;
      }
      return toResolved(b, score);
    })
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score < 10) {
    if (scored.length === 1) {
      return {
        booking: scored[0],
        ambiguous: [],
        warnings: [
          "Using your only open booking — mention the booking title if this is wrong.",
        ],
      };
    }
    return {
      booking: null,
      ambiguous: scored.slice(0, 5).map((b) => ({ id: b.id, title: b.title })),
      warnings: [
        "Could not identify which booking you mean. Pick a booking or include its title.",
      ],
    };
  }

  const closeMatches = scored.filter((b) => b.score >= top.score - 5 && b.score >= 10);
  if (closeMatches.length > 1 && top.score < 40) {
    return {
      booking: null,
      ambiguous: closeMatches.slice(0, 5).map((b) => ({ id: b.id, title: b.title })),
      warnings: ["Multiple bookings match — please be more specific."],
    };
  }

  return { booking: top, ambiguous: [], warnings };
}

function toResolved(
  booking: {
    id: string;
    careRequestId: string;
    organisationId: string;
    status: string;
    scheduledStartAt: Date | null;
    scheduledEndAt: Date | null;
    location: string | null;
    tasks: unknown;
    careRequest: { id: string; title: string };
  },
  score: number,
): ResolvedBooking {
  return {
    id: booking.id,
    careRequestId: booking.careRequestId,
    organisationId: booking.organisationId,
    title: booking.careRequest.title,
    status: booking.status,
    scheduledStartAt: booking.scheduledStartAt,
    scheduledEndAt: booking.scheduledEndAt,
    location: booking.location,
    tasks: booking.tasks,
    score,
  };
}
