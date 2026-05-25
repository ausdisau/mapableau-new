import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { getMapableState } from "./tool-context";

export const createSupportTicketDraft = tool({
  name: "create_support_ticket_draft",
  description: "Create a support ticket draft for user confirmation.",
  inputSchema: z.object({
    subject: z.string().min(5),
    description: z.string().min(20),
    category: z.enum(["general", "booking", "billing", "accessibility"]).default("general"),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.requiresHumanConfirmation = true;
    state.actionStatus = "requires_confirmation";
    return {
      status: "draft_only",
      subject: input.subject,
      category: input.category,
      message: "Submit from Support when you are ready.",
    };
  },
});

export const classifySupportTicket = tool({
  name: "classify_support_ticket",
  description: "Classify a support request topic and urgency.",
  inputSchema: z.object({ text: z.string().min(10) }),
  callback: async (input) => ({
    category: /invoice|bill/i.test(input.text) ? "billing" : "general",
    urgency: /urgent|emergency|safeguard/i.test(input.text) ? "high" : "normal",
    routeTo: /safeguard|incident/i.test(input.text)
      ? "quality_safeguards"
      : "support_desk",
  }),
});

export const getSupportTicketStatus = tool({
  name: "get_support_ticket_status",
  description: "Get support ticket status summary.",
  inputSchema: z.object({ ticketId: z.string().min(1) }),
  callback: async (input) => ({
    ticketId: input.ticketId,
    status: "open",
    summary: "Your request is with the support team.",
  }),
});
