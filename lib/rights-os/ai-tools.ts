import { tool } from "ai";
import { z } from "zod";

import { explainPolicyDecision } from "@/lib/rights-os/explain";
import { getActiveAccess, getRightsHistory } from "@/lib/rights-os/ledger/ledger-service";
import { evaluatePolicy } from "@/lib/rights-os/policy-evaluator";
import { listPurposes } from "@/lib/rights-os/purpose-registry";

/** AI tools for RightsOS — explain and prepare only; never approve or change policy. */
export function createRightsOsAiTools(subjectUserId: string) {
  return {
    explainDataUseRequest: tool({
      description:
        "Explain a data-use request outcome in plain language. Does not evaluate or change policy.",
      inputSchema: z.object({
        purposeCode: z.string(),
        requestedFields: z.array(z.string()),
        requestedOperations: z
          .array(
            z.enum([
              "read",
              "disclose",
              "create_derived_data",
              "store",
              "update",
              "export",
              "contact",
            ])
          )
          .default(["read"]),
        recipientDisplayName: z.string(),
      }),
      execute: async (input) => {
        const decision = evaluatePolicy({
          requestId: "ai-explain-only",
          requester: { actorId: "system", actorType: "system" },
          recipient: { displayName: input.recipientDisplayName },
          subjectUserId,
          purposeCode: input.purposeCode,
          requestedOperations: input.requestedOperations,
          requestedFields: input.requestedFields,
          sourceAssets: [],
          context: {},
          requestedAt: new Date().toISOString(),
          onwardSharingRequested: false,
        });
        return explainPolicyDecision(decision);
      },
    }),

    listActiveRights: tool({
      description: "List active capability leases and capsules for the participant.",
      inputSchema: z.object({}),
      execute: async () => getActiveAccess(subjectUserId),
    }),

    readRightsLedger: tool({
      description: "Read recent rights audit history for the participant.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
      execute: async () => {
        const history = await getRightsHistory(subjectUserId);
        return {
          auditEvents: history.auditEvents.slice(0, 20),
          requestCount: history.requests.length,
        };
      },
    }),

    listRegisteredPurposes: tool({
      description: "List registered RightsOS purpose codes and descriptions.",
      inputSchema: z.object({}),
      execute: async () =>
        listPurposes().map((p) => ({
          code: p.code,
          description: p.description,
        })),
    }),
  };
}
