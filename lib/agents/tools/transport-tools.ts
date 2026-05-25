import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { getMapableState } from "./tool-context";

export const findAccessiblePickupPoints = tool({
  name: "find_accessible_pickup_points",
  description: "Suggest accessible pickup options (suburb-level, no exact home address).",
  inputSchema: z.object({
    suburb: z.string().min(2),
    accessibilityNeeds: z.array(z.string()).optional(),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.toolCalls.push({
      toolName: "find_accessible_pickup_points",
      status: "completed",
      riskLevel: "low",
    });
    return {
      suburb: input.suburb,
      options: [
        { label: "Community transport hub", accessibility: ["wheelchair"] },
        { label: "NDIS registered pickup zone", accessibility: ["wheelchair", "assistance_dog"] },
      ],
      note: "Exact addresses are not returned for privacy.",
    };
  },
});

export const checkDriverEligibility = tool({
  name: "check_driver_eligibility",
  description: "Check whether a driver meets basic eligibility (summary only).",
  inputSchema: z.object({ driverId: z.string().min(1) }),
  callback: async (input) => ({
    driverId: input.driverId,
    eligible: true,
    summary: "Verification and high-risk assignment require human confirmation.",
  }),
});

export const draftTransportBooking = tool({
  name: "draft_transport_booking",
  description: "Draft a transport booking request for participant confirmation.",
  inputSchema: z.object({
    pickupSuburb: z.string(),
    dropoffSuburb: z.string(),
    preferredDate: z.string().optional(),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.requiresHumanConfirmation = true;
    state.actionStatus = "requires_confirmation";
    return {
      status: "draft_only",
      pickupSuburb: input.pickupSuburb,
      dropoffSuburb: input.dropoffSuburb,
      message: "Draft only — confirm in Transport booking when ready.",
    };
  },
});
