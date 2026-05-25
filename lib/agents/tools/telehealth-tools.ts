import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { getMapableState } from "./tool-context";

export const draftTelehealthIntake = tool({
  name: "draft_telehealth_intake",
  description: "Draft telehealth intake notes for practitioner review (not clinical advice).",
  inputSchema: z.object({
    appointmentType: z.string().min(2),
    concernsSummary: z.string().min(10).max(2000),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_human_review";
    state.requiresHumanConfirmation = true;
    state.toolCalls.push({
      toolName: "draft_telehealth_intake",
      status: "drafted",
      riskLevel: "medium",
    });
    return {
      status: "draft_only",
      appointmentType: input.appointmentType,
      intakeSummary: input.concernsSummary.slice(0, 500),
      message: "A practitioner must review before any clinical summary is released.",
    };
  },
});

export const getTelehealthAppointmentSummary = tool({
  name: "get_telehealth_appointment_summary",
  description: "Return a redacted upcoming telehealth appointment summary.",
  inputSchema: z.object({ appointmentId: z.string().min(1).optional() }),
  callback: async () => ({
    status: "scheduled",
    summary: "Upcoming telehealth session — join via your dashboard link.",
  }),
});

export const preparePractitionerReviewSummary = tool({
  name: "prepare_practitioner_review_summary",
  description: "Prepare a practitioner review pack from intake draft (no diagnosis).",
  inputSchema: z.object({ intakeDraftId: z.string().min(1) }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_human_review";
    return {
      intakeDraftId: input.intakeDraftId,
      status: "needs_practitioner_review",
      sections: ["presenting concerns", "accessibility needs", "consent status"],
    };
  },
});
