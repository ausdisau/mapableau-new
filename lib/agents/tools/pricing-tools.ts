import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { getMapableState } from "./tool-context";

export const lookupSupportItem = tool({
  name: "lookup_support_item",
  description: "Look up NDIS support item metadata (code, description, unit).",
  inputSchema: z.object({
    supportItemCode: z.string().min(3),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.toolCalls.push({
      toolName: "lookup_support_item",
      status: "completed",
      riskLevel: "low",
      outputSummary: input.supportItemCode,
    });
    return {
      code: input.supportItemCode,
      description: "Support item metadata lookup (summary only).",
      unit: "hour",
      note: "Pricing is indicative; final claim validation requires human review.",
    };
  },
});

export const estimateServiceQuote = tool({
  name: "estimate_service_quote",
  description: "Estimate a service quote from support item and duration (draft only).",
  inputSchema: z.object({
    supportItemCode: z.string().min(3),
    durationHours: z.number().positive().max(24),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.toolCalls.push({
      toolName: "estimate_service_quote",
      status: "completed",
      riskLevel: "low",
    });
    return {
      supportItemCode: input.supportItemCode,
      estimatedAud: (input.durationHours * 65).toFixed(2),
      disclaimer: "Estimate only — not a guarantee of NDIS payment approval.",
    };
  },
});

export const explainPricingFinding = tool({
  name: "explain_pricing_finding",
  description: "Explain a pricing validation finding in plain language.",
  inputSchema: z.object({
    findingCode: z.string(),
    context: z.string().optional(),
  }),
  callback: async (input) => ({
    findingCode: input.findingCode,
    explanation:
      "This finding flags a potential mismatch between the service log and the billed support item. Review with your plan manager or provider billing team.",
  }),
});
