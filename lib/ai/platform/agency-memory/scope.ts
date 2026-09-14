import { getCategoryEntry } from "./registry";
import { getControls, listMemoryItems } from "./store";
import type { AgencyMemoryCategory, MapAbleAgencyMemoryItem } from "./types";

/**
 * Scope, consent, purpose binding, and tenant isolation helpers.
 */

export function assertSameTenant(params: {
  itemTenantId: string;
  requestTenantId: string;
}): void {
  if (params.itemTenantId !== params.requestTenantId) {
    throw new Error("AGENCY_MEMORY_CROSS_TENANT_FORBIDDEN");
  }
}

export function assertParticipantScope(params: {
  itemParticipantId: string;
  requestParticipantId: string;
}): void {
  if (params.itemParticipantId !== params.requestParticipantId) {
    throw new Error("AGENCY_MEMORY_PARTICIPANT_MISMATCH");
  }
}

export function assertPurposeForCategory(params: {
  category: AgencyMemoryCategory;
  purpose?: string;
}): void {
  const entry = getCategoryEntry(params.category);
  if (entry.requiresPurpose && !params.purpose?.trim()) {
    throw new Error(`AGENCY_MEMORY_PURPOSE_REQUIRED:${params.category}`);
  }
}

/** Jobs disclosure preferences remain purpose-specific. */
export function filterByPurpose(
  items: MapAbleAgencyMemoryItem[],
  purposes?: string[],
): MapAbleAgencyMemoryItem[] {
  if (!purposes?.length) {
    return items.filter((item) => {
      const entry = getCategoryEntry(item.category);
      return !entry.requiresPurpose;
    });
  }
  return items.filter((item) => {
    const entry = getCategoryEntry(item.category);
    if (!entry.requiresPurpose) return true;
    return item.purpose != null && purposes.includes(item.purpose);
  });
}

export function filterByConsentScopes(
  items: MapAbleAgencyMemoryItem[],
  consentScopes?: string[],
): MapAbleAgencyMemoryItem[] {
  if (!consentScopes?.length) return items;
  return items.filter((item) => {
    if (!item.consentScopes.length) return true;
    return item.consentScopes.some((s) => consentScopes.includes(s));
  });
}

export function isExpired(item: MapAbleAgencyMemoryItem, now = new Date()): boolean {
  if (!item.expiresAt) return false;
  return new Date(item.expiresAt).getTime() <= now.getTime();
}

/**
 * Only confirmed, non-deleted, non-expired memory may affect personalisation.
 * Honours pause / AI-disable controls for model context (manual management still allowed).
 */
export function listUsableForPersonalisation(params: {
  participantId: string;
  tenantId: string;
  categories?: AgencyMemoryCategory[];
  purposes?: string[];
  consentScopes?: string[];
  forModelContext?: boolean;
}): MapAbleAgencyMemoryItem[] {
  const controls = getControls(params);
  if (params.forModelContext) {
    if (controls.personalisationPaused || controls.aiUseDisabled) {
      return [];
    }
  }

  let items = listMemoryItems(params).filter(
    (m) =>
      m.confirmationState === "confirmed" &&
      !m.deletedAt &&
      !isExpired(m),
  );

  if (params.categories?.length) {
    items = items.filter((m) => params.categories!.includes(m.category));
  }

  items = filterByPurpose(items, params.purposes);
  items = filterByConsentScopes(items, params.consentScopes);
  return items;
}

export function providerExclusionRespected(
  items: MapAbleAgencyMemoryItem[],
  providerId: string,
): boolean {
  const exclusions = items.filter(
    (m) =>
      m.category === "provider_exclusion" &&
      m.confirmationState === "confirmed",
  );
  return exclusions.some((m) => {
    if (
      typeof m.structuredValue === "object" &&
      m.structuredValue !== null &&
      "providerId" in m.structuredValue
    ) {
      return (
        String((m.structuredValue as { providerId: unknown }).providerId) ===
        providerId
      );
    }
    return m.statement.toLowerCase().includes(providerId.toLowerCase());
  });
}

export function communicationPreferenceValue(
  items: MapAbleAgencyMemoryItem[],
): string | null {
  const prefs = items.filter(
    (m) =>
      m.category === "communication" && m.confirmationState === "confirmed",
  );
  if (!prefs.length) return null;
  const latest = prefs.sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  )[0]!;
  if (
    typeof latest.structuredValue === "object" &&
    latest.structuredValue !== null &&
    "value" in latest.structuredValue
  ) {
    return String((latest.structuredValue as { value: unknown }).value);
  }
  return latest.statement;
}
