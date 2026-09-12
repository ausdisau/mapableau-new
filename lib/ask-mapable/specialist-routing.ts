/**
 * Specialist routing hints for Ask MapAble → Intelligence Fabric specialists.
 * Prefer one specialist; avoid fan-out. Tools remain deterministic / existing services.
 */

import type { CopilotIntentType } from "@/lib/copilot/types";

export type SpecialistId =
  | "access"
  | "care"
  | "transport"
  | "jobs"
  | "foods"
  | "moves"
  | "payments"
  | "participant_advocate"
  | "continuity"
  | "rights"
  | "safeguarding"
  | "provider_capacity"
  | "worker_support";

export type SpecialistRoute = {
  primary: SpecialistId;
  supporting: SpecialistId[];
  reason: string;
};

export function routeSpecialists(
  intent: CopilotIntentType,
  query: string,
): SpecialistRoute {
  const q = query.toLowerCase();

  if (intent === "incident" || /\b(abuse|neglect|unsafe|harm|safeguard)/i.test(q)) {
    return {
      primary: "safeguarding",
      supporting: ["rights", "participant_advocate"],
      reason: "Safeguarding language routes to gate + human pathway; AI does not decide.",
    };
  }

  if (intent === "places" || /\b(accessible|venue|step-free|toilet|wheelchair)/i.test(q)) {
    return {
      primary: "access",
      supporting: [],
      reason: "Accessibility evidence query.",
    };
  }

  if (intent === "transport") {
    const supporting: SpecialistId[] = [];
    if (/\b(venue|place|entrance|toilet)/i.test(q)) supporting.push("access");
    if (/\b(contingency|backup|if .+ cancel)/i.test(q)) supporting.push("continuity");
    return {
      primary: "transport",
      supporting,
      reason: "Accessible journey planning.",
    };
  }

  if (intent === "support" || intent === "combined" || intent === "health") {
    return {
      primary: "care",
      supporting: intent === "combined" ? ["transport", "participant_advocate"] : ["participant_advocate"],
      reason: "Support planning with participant authority checks.",
    };
  }

  if (intent === "jobs") {
    const supporting: SpecialistId[] = [];
    if (/\b(workplace|access|ramp|toilet)/i.test(q)) supporting.push("access");
    if (/\b(transport|commute|travel)/i.test(q)) supporting.push("transport");
    return {
      primary: "jobs",
      supporting,
      reason: "Employment adjustment / inclusive work.",
    };
  }

  if (intent === "billing" || intent === "ndis") {
    return {
      primary: "payments",
      supporting: ["participant_advocate"],
      reason: "Explain existing plan/invoice information only — no claim approval.",
    };
  }

  if (/\b(right|discriminat|advocacy|complaint)\b/i.test(q)) {
    return {
      primary: "rights",
      supporting: ["participant_advocate"],
      reason: "Rights and advocacy concern.",
    };
  }

  return {
    primary: "participant_advocate",
    supporting: [],
    reason: "Default: protect participant authority and suggest safe next steps.",
  };
}
