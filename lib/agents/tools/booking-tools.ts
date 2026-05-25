import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { getMapableState } from "./tool-context";
import { toToolJson } from "./to-tool-json";

export const getUpcomingBookings = tool({
  name: "get_upcoming_bookings",
  description: "List upcoming bookings for the participant.",
  inputSchema: z.object({ limit: z.number().int().min(1).max(10).default(5) }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    const userId = state.context.participantId ?? state.context.userId;
    const bookings = await prisma.booking.findMany({
      where: {
        participantId: userId,
        status: { in: ["requested", "confirmed", "in_progress"] },
      },
      orderBy: { requestedStart: "asc" },
      take: input.limit,
      select: {
        id: true,
        bookingType: true,
        status: true,
        requestedStart: true,
      },
    });
    return toToolJson({
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingType: b.bookingType,
        status: b.status,
        requestedStart: b.requestedStart.toISOString(),
      })),
    });
  },
});

export const draftBookingRequest = tool({
  name: "draft_booking_request",
  description: "Draft a booking request for participant confirmation.",
  inputSchema: z.object({
    bookingType: z.enum(["care", "transport", "care_transport"]),
    notes: z.string().optional(),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_confirmation";
    return toToolJson({
      status: "draft_only",
      bookingType: input.bookingType,
      notes: input.notes ?? null,
      message: "Confirm on the bookings page to submit.",
    });
  },
});

export const checkBookingEligibility = tool({
  name: "check_booking_eligibility",
  description: "Check if a provider organisation is booking eligible.",
  inputSchema: z.object({ organisationId: z.string().min(1) }),
  callback: async (input) => {
    const org = await prisma.organisation.findUnique({
      where: { id: input.organisationId },
      select: { bookingEligible: true, verificationStatus: true, name: true },
    });
    if (!org) {
      return toToolJson({
        eligible: false,
        reason: "Provider not found.",
        providerName: null,
      });
    }
    const eligible =
      org.bookingEligible && org.verificationStatus === "verified";
    return toToolJson({
      eligible,
      providerName: org.name,
      reason: eligible
        ? "Provider can receive booking requests."
        : "Provider must complete verification before bookings.",
    });
  },
});

export const createBookingDraftOnly = tool({
  name: "create_booking_draft_only",
  description: "Create a booking draft placeholder for confirmation.",
  inputSchema: z.object({
    bookingType: z.enum(["care", "transport", "care_transport"]),
    organisationId: z.string().optional(),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_confirmation";
    state.requiresHumanConfirmation = true;
    return toToolJson({
      status: "draft_only",
      ...input,
      message: "Draft prepared — confirm in MapAble bookings.",
    });
  },
});
