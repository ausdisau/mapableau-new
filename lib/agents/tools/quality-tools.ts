import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { getMapableState } from "./tool-context";

export const getQualityActionQueue = tool({
  name: "get_quality_action_queue",
  description: "Open quality signals for an organisation.",
  inputSchema: z.object({}),
  callback: async (_input, context) => {
    const state = getMapableState(context);
    const orgId = state.context.organisationId;
    if (!orgId) return { signals: [] };
    const signals = await prisma.providerQualitySignal.findMany({
      where: { organisationId: orgId, status: "open" },
      take: 10,
      select: { signalType: true, severity: true, summary: true },
    });
    return { signals };
  },
});

export const draftIncidentReport = tool({
  name: "draft_incident_report",
  description: "Draft an incident report for human review.",
  inputSchema: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    safeguarding: z.boolean().default(false),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_human_review";
    state.requiresHumanConfirmation = true;
    return {
      status: "draft_only",
      title: input.title,
      safeguarding: input.safeguarding,
      message: "Submit via incidents page after review.",
    };
  },
});

export const classifyIncidentRisk = tool({
  name: "classify_incident_risk",
  description: "Classify incident severity from description (draft only).",
  inputSchema: z.object({ description: z.string().min(10) }),
  callback: async (input) => {
    const critical = /injury|abuse|neglect|emergency|hospital/i.test(input.description);
    return {
      suggestedSeverity: critical ? "high" : "medium",
      requiresHumanReview: true,
      note: "Classification is indicative only.",
    };
  },
});

export const draftComplaint = tool({
  name: "draft_complaint",
  description: "Draft a complaint record.",
  inputSchema: z.object({
    category: z.string().min(2),
    description: z.string().min(10),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_confirmation";
    return { status: "draft_only", ...input };
  },
});

export const createComplaintDraftOnly = tool({
  name: "create_complaint_draft_only",
  description: "Prepare complaint draft for confirmation.",
  inputSchema: z.object({
    category: z.string(),
    description: z.string().min(10),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.requiresHumanConfirmation = true;
    return { status: "draft_only", ...input };
  },
});

export const listIncidentDeadlines = tool({
  name: "list_incident_deadlines",
  description: "List incident reporting deadline guidance (no PII).",
  inputSchema: z.object({}),
  callback: async () => ({
    deadlines: [
      { type: "internal_review", withinHours: 24, note: "" },
      {
        type: "external_reportability",
        withinHours: 0,
        note: "Requires authorised human decision",
      },
    ],
  }),
});

export const createIncidentDraftOnly = tool({
  name: "create_incident_draft_only",
  description: "Create incident draft only.",
  inputSchema: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_human_review";
    state.requiresHumanConfirmation = true;
    return { status: "draft_only", title: input.title };
  },
});

export const getComplaintStatus = tool({
  name: "get_complaint_status",
  description: "Get complaint status summary for authorised user.",
  inputSchema: z.object({ complaintId: z.string().min(1) }),
  callback: async (input) => ({
    complaintId: input.complaintId,
    status: "under_review",
    summary: "Your complaint is being reviewed by the quality team.",
  }),
});

export const draftContinuousImprovementAction = tool({
  name: "draft_continuous_improvement_action",
  description: "Draft a continuous improvement action for provider quality.",
  inputSchema: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_confirmation";
    return { status: "draft_only", ...input };
  },
});

export const getPolicySummary = tool({
  name: "get_policy_summary",
  description: "Return a public policy summary snippet.",
  inputSchema: z.object({ policyKey: z.string().min(2) }),
  callback: async (input) => ({
    policyKey: input.policyKey,
    summary: "MapAble quality and safeguarding policies require human review for closures and external reporting.",
  }),
});

export const closeIncidentTool = tool({
  name: "close_incident",
  description: "BLOCKED",
  inputSchema: z.object({ incidentId: z.string() }),
  callback: async () => ({ blocked: true }),
});
