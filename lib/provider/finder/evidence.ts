import type { Provider } from "@/app/provider-finder/providers";

/**
 * Directory activity is not the same as current NDIS Commission registration.
 * Never interpret this as a worker-screening decision or a funding approval.
 */
export type DirectoryActivity =
  | "active_in_source"
  | "not_active_in_source"
  | "unknown";

export type ProviderDirectorySource = "ndis_import" | "demo" | "unknown";

export const NDIS_PROVIDER_REGISTER_URL =
  "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider";
export const NDIS_WORKER_SCREENING_URL =
  "https://www.ndiscommission.gov.au/workforce/worker-screening";
export const NDIS_COMPLIANCE_ACTIONS_URL =
  "https://www.ndiscommission.gov.au/compliance-and-enforcement-actions";

/** Strict parsing: substring matches such as "unregistered" must never be positive. */
export function parseDirectoryActivity(value: unknown): DirectoryActivity {
  if (value === 1 || value === true) return "active_in_source";
  if (value === 0 || value === false) return "not_active_in_source";
  if (typeof value !== "string") return "unknown";

  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (["1", "active", "approved", "registered"].includes(normalized)) {
    return "active_in_source";
  }
  if (
    [
      "0", "inactive", "unregistered", "not registered", "not approved",
      "no valid registration", "revoked", "registration revoked",
      "suspended", "excluded",
    ].includes(normalized)
  ) {
    return "not_active_in_source";
  }
  return "unknown";
}

/** Do not treat a negative service statement as evidence of service provision. */
export function isAffirmativeServiceLabel(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text || text.length > 120) return false;
  return !/^(?:no\b|not\b|without\b|unable\b|unavailable\b|does not\b|do not\b|don't\b|excluded?\b)/i.test(text) &&
    !/\b(?:not offered|not provided|not available|no vacancies|service unavailable|not supported)\b/i.test(text);
}

/** Ternary AAC declarations; a mention of "AAC" alone is not evidence of support. */
export function interpretAacDeclaration(value: unknown): "supported" | "not_supported" | "unknown" {
  if (typeof value !== "string") return "unknown";
  const text = value.trim().toLowerCase();
  if (!/\baac\b/.test(text)) return "unknown";
  if (
    /\b(?:no|without|not providing|does not provide)\s+aac\b/.test(text) ||
    /\baac\b.{0,24}\b(?:not available|unavailable|not offered|not supported|unsupported)\b/.test(text)
  ) {
    return "not_supported";
  }
  if (
    /\b(?:supports?|provides?|offers?)\s+aac\b/.test(text) ||
    /\baac\b.{0,24}\b(?:supported|available|offered|provided)\b/.test(text)
  ) {
    return "supported";
  }
  return "unknown";
}

/**
 * "registered" is a legacy Boolean in the UI model mapped from a local outlet Active flag.
 * It must not be used as proof of live provider registration.
 */
export function getDirectoryActivity(provider: Pick<Provider, "source" | "directoryActivity">): DirectoryActivity {
  return provider.source === "ndis_import" ? (provider.directoryActivity ?? "unknown") : "unknown";
}

/**
 * Legacy internal filter IDs are retained for URL compatibility, but now filter
 * local directory activity only. They are NOT NDIS funding-eligibility filters.
 */
export function matchesDirectoryFilter(
  provider: Pick<Provider, "source" | "directoryActivity">,
  filter: "all" | "ndis" | "private",
): boolean {
  if (filter === "all") return true;
  const activity = getDirectoryActivity(provider);
  return filter === "ndis"
    ? activity === "active_in_source"
    : activity === "not_active_in_source";
}

export function getProviderEvidence(
  provider: Pick<Provider, "source" | "directoryActivity" | "abn">,
) {
  const imported = provider.source === "ndis_import";
  const activity = getDirectoryActivity(provider);
  return {
    provenance: imported
      ? "Locally imported NDIS provider-directory outlet"
      : provider.source === "demo"
        ? "Demonstration record — not a live recommendation"
        : "Record provenance not established",
    directoryActivity: activity === "active_in_source"
      ? "Marked active in the imported directory"
      : activity === "not_active_in_source"
        ? "Not marked active in the imported directory"
        : "Directory activity not established",
    registration: "Current registration not independently verified",
    workerScreening: "Individual worker screening not independently verified",
    availability: "Not confirmed — enquire directly",
    responseTime: "Not independently verified",
    accessibility: "AAC, access features and worker competence not verified",
    funding: "Funding compatibility requires current registration and plan-rule checks",
    abn: imported && /^\d{11}$/.test(provider.abn ?? "") ? provider.abn : undefined,
  } as const;
}
