import type { MapAbleModule } from "@/intelligence/types";

import type { MissionRoutingResult } from "./types";

type DomainRule = {
  domain: MapAbleModule;
  patterns: RegExp[];
  reason: string;
};

const DOMAIN_RULES: DomainRule[] = [
  {
    domain: "transport",
    patterns: [
      /\btransport\b/i,
      /\btravel\b/i,
      /\bdrive\b/i,
      /\btaxi\b/i,
      /\buber\b/i,
      /\bget(?:ting)?\s+there\b/i,
      /\barriv(?:e|al)\b/i,
      /\bjourney\b/i,
      /\bvehicle\b/i,
      /\bwheelchair[\s-]?accessible\b/i,
    ],
    reason: "transport_or_travel_language",
  },
  {
    domain: "care",
    patterns: [
      /\bsupport\s+worker\b/i,
      /\bpersonal\s+assist/i,
      /\bcare\b/i,
      /\bhelp\s+getting\s+ready\b/i,
      /\bhelp\s+getting\s+there\b/i,
      /\bsupport\s+getting\s+there\b/i,
      /\bneed\s+support\b/i,
      /\bprepare\b/i,
      /\bndis\s+support\b/i,
    ],
    reason: "care_or_support_language",
  },
  {
    domain: "jobs",
    patterns: [
      /\bjob\b/i,
      /\bwork\b/i,
      /\binterview\b/i,
      /\bemployer\b/i,
      /\bworkplace\b/i,
      /\bshift\b/i,
    ],
    reason: "work_or_interview_language",
  },
  {
    domain: "access",
    patterns: [
      /\baccess(?:ible|ibility)?\b/i,
      /\bramp\b/i,
      /\blift\b/i,
      /\btoilet\b/i,
      /\bwheelchair\b/i,
      /\bvenue\b/i,
    ],
    reason: "accessibility_language",
  },
  {
    domain: "payments",
    patterns: [
      /\binvoice\b/i,
      /\bbill(?:ing)?\b/i,
      /\bpay(?:ment)?\b/i,
      /\bfunding\b/i,
      /\bndis\s+claim\b/i,
    ],
    reason: "financial_language",
  },
];

const ALL_MISSION_DOMAINS: MapAbleModule[] = [
  "core",
  "care",
  "transport",
  "jobs",
  "access",
  "payments",
];

function inferDomainsFromText(objective: string): MapAbleModule[] {
  const inferred = new Set<MapAbleModule>();
  for (const rule of DOMAIN_RULES) {
    if (rule.patterns.some((p) => p.test(objective))) {
      inferred.add(rule.domain);
    }
  }
  return [...inferred];
}

function financeIncidentalOnly(objective: string, domains: MapAbleModule[]): boolean {
  const hasFinancialTask =
    /\b(invoice|billing|claim|pay|fund(?:ing)?)\b/i.test(objective) &&
    !/\binterview\b/i.test(objective);
  return domains.includes("payments") && !hasFinancialTask;
}

/**
 * Deterministic domain router. Final allowed-domain decision is never LLM-controlled.
 */
export function routeMissionDomains(input: {
  objective: string;
  requestedDomains?: MapAbleModule[];
  addedDomains?: MapAbleModule[];
  removedDomains?: MapAbleModule[];
  source?: string;
}): MissionRoutingResult {
  const reasons: Record<string, string> = {};
  const requested = new Set<MapAbleModule>(
    input.requestedDomains?.length
      ? input.requestedDomains
      : input.source === "transport"
        ? ["transport", "access"]
        : input.source === "care"
          ? ["care"]
          : input.source === "jobs"
            ? ["jobs"]
            : input.source === "access"
              ? ["access"]
              : [],
  );

  const inferred = inferDomainsFromText(input.objective);
  for (const d of inferred) {
    reasons[d] = "inferred_from_objective_language";
  }

  const combined = new Set<MapAbleModule>(["core", ...requested, ...inferred]);
  for (const d of input.addedDomains ?? []) {
    combined.add(d);
    reasons[d] = "participant_added_domain";
  }

  const rejected: MapAbleModule[] = [];
  for (const d of input.removedDomains ?? []) {
    if (combined.delete(d)) {
      rejected.push(d);
      reasons[d] = "participant_removed_domain";
    }
  }

  const allowed: MapAbleModule[] = [];
  for (const d of ALL_MISSION_DOMAINS) {
    if (!combined.has(d)) continue;
    if (d === "payments" && financeIncidentalOnly(input.objective, [...combined])) {
      rejected.push(d);
      reasons[d] = "financial_incidental_only";
      continue;
    }
    allowed.push(d);
  }

  if (allowed.length === 1 && allowed[0] === "core") {
    // Pure goal with no domain cues — keep core only
    reasons.core = "default_core_only";
  }

  return {
    requestedDomains: [...requested],
    inferredDomains: inferred,
    allowedDomains: allowed,
    rejectedDomains: rejected,
    reasons,
  };
}
