import { accessDomainNotes } from "./domains/access";
import { careDomainNotes } from "./domains/care";
import { jobsDomainNotes } from "./domains/jobs";
import { transportDomainNotes } from "./domains/transport";
import type { OptionsDomain } from "./types";

export const CONSOLIDATED_MATCHING_SOURCES = [
  { key: "matching.care_rules", algorithmRegisterRef: "alg.care_matching_rules", domain: "care" as OptionsDomain, role: "deterministic_filter", notes: "Canonical care hard-filter + explainable factors; Options Engine facade." },
  { key: "matching.ai_overlay", algorithmRegisterRef: "alg.ai_matching_overlay", domain: "care" as OptionsDomain, role: "optional_model_commentary", notes: "Optional overlay only; never overrides hard constraints." },
  { key: "navigator.provider_search.match", algorithmRegisterRef: "alg.navigator_match", domain: "care" as OptionsDomain, role: "hard_constraints_and_rank", notes: "Navigator Stage-1 hard constraints + Stage-2 preference rank reused." },
  { key: "transport.vehicle_suitability", algorithmRegisterRef: "alg.options_engine_transport", domain: "transport" as OptionsDomain, role: "eligibility", notes: "Vehicle suitability / eligibility services remain SoR for trips." },
  { key: "jobs.match_explanation", algorithmRegisterRef: "alg.options_engine_jobs", domain: "jobs" as OptionsDomain, role: "explanation", notes: "Jobs match explanation + fairness boundaries; disclosure protected." },
  { key: "access.gais_evidence", algorithmRegisterRef: "alg.options_engine_access", domain: "access" as OptionsDomain, role: "evidence", notes: "GAIS/Access evidence with source/freshness; absence ≠ accessible." },
] as const;

export const OPTIONS_ENGINE_ALGORITHM_REFS: Record<OptionsDomain, string> = {
  care: "alg.options_engine_care", transport: "alg.options_engine_transport", jobs: "alg.options_engine_jobs", access: "alg.options_engine_access",
};
export const OPTIONS_ENGINE_CAPABILITY_KEY = "matching.options_engine";
export const OPTIONS_MODEL_EXPLANATION_CAPABILITY_KEY = "matching.options_model_explanation";

export function domainLimitations(domain: OptionsDomain): string[] {
  switch (domain) {
    case "care": return careDomainNotes();
    case "transport": return transportDomainNotes();
    case "jobs": return jobsDomainNotes();
    case "access": return accessDomainNotes();
    default: { const _exhaustive: never = domain; void _exhaustive; return []; }
  }
}
export function algorithmRegisterRefForDomain(domain: OptionsDomain): string { return OPTIONS_ENGINE_ALGORITHM_REFS[domain]; }
