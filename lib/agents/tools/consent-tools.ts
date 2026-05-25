import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { checkConsent } from "@/lib/consent/consent-service";
import type { ConsentScope } from "@/types/mapable";

import { getMapableState } from "./tool-context";

export const checkConsentScopeTool = tool({
  name: "check_consent_scope",
  description: "Check if a consent scope is active.",
  inputSchema: z.object({
    scope: z.string().min(1),
    grantedToOrganisationId: z.string().optional(),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    const participantId = state.context.participantId ?? state.context.userId;
    const active = await checkConsent({
      subjectUserId: participantId,
      scope: input.scope as ConsentScope,
      grantedToOrganisationId: input.grantedToOrganisationId,
      grantedToUserId: input.grantedToOrganisationId
        ? undefined
        : state.context.userId,
    });
    return { scope: input.scope, active };
  },
});

export const draftConsentRequest = tool({
  name: "draft_consent_request",
  description: "Draft a consent request for the participant to review (cannot grant on their behalf).",
  inputSchema: z.object({
    scope: z.string().min(1),
    grantedToLabel: z.string().min(2),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_confirmation";
    return {
      status: "draft_only",
      scope: input.scope,
      grantedToLabel: input.grantedToLabel,
      message: "The participant must approve consent in the Consent centre.",
    };
  },
});

export const explainConsentScope = tool({
  name: "explain_consent_scope",
  description: "Explain what a consent scope allows in plain language.",
  inputSchema: z.object({ scope: z.string().min(1) }),
  callback: async (input) => {
    const explanations: Record<string, string> = {
      "profile.read": "Allows reading basic profile information.",
      "accessibility.read": "Allows reading accessibility preferences for safer supports.",
      "billing.read": "Allows reading invoice summaries for plan management.",
      "support_coordination.access": "Allows support coordinators to coordinate services.",
      "plan_manager.invoice_access": "Allows plan managers to review linked invoices.",
    };
    return {
      scope: input.scope,
      explanation:
        explanations[input.scope] ??
        "This scope controls what information can be shared with a trusted party.",
    };
  },
});
