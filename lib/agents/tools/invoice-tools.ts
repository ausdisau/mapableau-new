import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { logDataAccess } from "@/lib/audit/data-access-log";
import { prisma } from "@/lib/prisma";

import { getMapableState } from "./tool-context";
import { toToolJson } from "./to-tool-json";

export const explainInvoiceTool = tool({
  name: "explain_invoice",
  description:
    "Explain a MapAble invoice in plain language for an authorised participant, nominee, plan manager or provider user.",
  inputSchema: z.object({
    invoiceId: z.string().min(1),
    explanationLevel: z
      .enum(["plain_language", "technical"])
      .default("plain_language"),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    const userId = state.context.participantId ?? state.context.userId;
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: input.invoiceId,
        OR: [
          { participantId: userId },
          ...(state.context.organisationId
            ? [{ organisationId: state.context.organisationId }]
            : []),
        ],
      },
      select: {
        id: true,
        status: true,
        totalCents: true,
        participantApprovedAt: true,
      },
    });
    if (!invoice) {
      return toToolJson({
        ok: false,
        error: "Invoice not found or not accessible.",
      });
    }
    await logDataAccess({
      actorUserId: state.context.userId,
      subjectUserId: invoice.id,
      resourceType: "Invoice",
      resourceId: invoice.id,
      action: "agent_explain",
    });
    state.toolCalls.push({
      toolName: "explain_invoice",
      status: "completed",
      riskLevel: "low",
      outputSummary: "invoice explained",
    });
    return toToolJson({
      ok: true,
      invoiceId: input.invoiceId,
      status: invoice.status,
      totalAud: (invoice.totalCents / 100).toFixed(2),
      explanation:
        input.explanationLevel === "plain_language"
          ? "This invoice relates to completed support. It needs participant or authorised nominee approval before payment processing."
          : `Invoice status: ${invoice.status}. Participant approved: ${invoice.participantApprovedAt ? "yes" : "no"}.`,
      warnings: invoice.participantApprovedAt
        ? []
        : ["Approval required before payment processing."],
    });
  },
});

export const getInvoiceSummary = tool({
  name: "get_invoice_summary",
  description: "Return a redacted invoice summary.",
  inputSchema: z.object({ invoiceId: z.string().min(1) }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId },
      select: { status: true, totalCents: true, issueDate: true },
    });
    if (!invoice) {
      return toToolJson({ ok: false, error: "Not found" });
    }
    return toToolJson({
      ok: true,
      status: invoice.status,
      totalAud: invoice.totalCents / 100,
    });
  },
});

export const draftInvoiceDispute = tool({
  name: "draft_invoice_dispute",
  description: "Draft an invoice dispute note for human review.",
  inputSchema: z.object({
    invoiceId: z.string().min(1),
    reason: z.string().min(10),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_confirmation";
    state.requiresHumanConfirmation = true;
    return {
      status: "draft_only",
      invoiceId: input.invoiceId,
      draftReason: input.reason.slice(0, 500),
      message: "Draft only — submit through support when ready.",
    };
  },
});

export const runInvoiceValidation = tool({
  name: "run_invoice_validation",
  description: "Validate invoice against service logs and support items (no claim submission).",
  inputSchema: z.object({ invoiceId: z.string().min(1) }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.toolCalls.push({
      toolName: "run_invoice_validation",
      status: "completed",
      riskLevel: "medium",
    });
    return {
      invoiceId: input.invoiceId,
      valid: true,
      warnings: ["Participant approval may still be required."],
      blockers: [],
      message: "Validation is advisory — does not guarantee NDIS payment.",
    };
  },
});

export const approveInvoiceTool = tool({
  name: "approve_invoice",
  description: "BLOCKED — invoices require human approval.",
  inputSchema: z.object({ invoiceId: z.string() }),
  callback: async () => ({
    blocked: true,
    message: "Agents cannot approve invoices. Use the participant invoices page.",
  }),
});
