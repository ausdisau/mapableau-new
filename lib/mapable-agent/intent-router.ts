import type { MapableAgentIntent, MapableAgentIntentResult } from "@/lib/mapable-agent/types";

const PLAN = /\b(ndis\s*plan|plan\s*goals|budget|funding|support\s*category|core\s*supports|capacity\s*building|plan\s*review)\b/i;
const BILLING = /\b(invoice|claim|line\s*item|plan\s*manager|payment|receipt|billing|duplicate|price\s*limit)\b/i;
const TRANSPORT = /\b(transport|wheelchair|accessible\s*trip|ride|pick\s*up|drop\s*off|driver|quote)\b/i;
const JOBS = /\b(job|interview|employer|resume|workplace|employment|inclusive\s*job)\b/i;
const SAFEGUARDING =
  /\b(complaint|incident|unsafe|harm|abuse|neglect|exploitation|urgent|emergency|safeguard)\b/i;

export function classifyMapableAgentIntent(
  query: string,
): MapableAgentIntentResult {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { type: "general", confidence: 0, filters: {} };
  }

  if (SAFEGUARDING.test(q)) {
    return { type: "safeguarding", confidence: 0.95, filters: { urgent: true } };
  }
  if (BILLING.test(q)) {
    return { type: "billing", confidence: 0.9, filters: {} };
  }
  if (PLAN.test(q)) {
    return { type: "plan", confidence: 0.88, filters: {} };
  }
  if (TRANSPORT.test(q)) {
    return { type: "transport", confidence: 0.85, filters: {} };
  }
  if (JOBS.test(q)) {
    return { type: "jobs", confidence: 0.85, filters: {} };
  }

  return { type: "general", confidence: 0.6, filters: {} };
}

export function toolsForIntent(intent: MapableAgentIntent): string[] {
  const common = ["logAuditEvent", "createHumanReviewTask"];
  switch (intent) {
    case "plan":
      return [
        ...common,
        "getParticipantProfile",
        "getConsentStatus",
        "parseNDISPlan",
        "extractPlanGoals",
        "mapSupportToBudgetCategory",
      ];
    case "billing":
      return [
        ...common,
        "getConsentStatus",
        "classifyInvoiceLineItems",
        "checkDuplicateInvoice",
        "checkPriceLimit",
      ];
    case "transport":
      return [...common, "getConsentStatus", "quoteAccessibleTrip"];
    case "jobs":
      return [...common, "searchInclusiveJobs"];
    case "safeguarding":
      return [...common, "getConsentStatus", "createHumanReviewTask"];
    case "general":
    default:
      return [
        ...common,
        "getConsentStatus",
        "searchSupportWorkers",
        "draftProviderMessage",
      ];
  }
}
