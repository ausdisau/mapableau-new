import { createHash } from "crypto";

import { runStartingWorkJourneyAccessCast } from "./journey";
import type { StartingWorkJourneyInput } from "./journey";
import type { AccessCastState } from "./states";
import type { AccessCastResult } from "./types";

/** Storage key contract — Companion SecureStore must use this exact key. */
export const ACCESSCAST_OFFLINE_STORAGE_KEY = "companion.accesscast.outlook.v1";

/**
 * Offline AccessCast Visit Pack projection.
 * Must never be presented as a silently current live forecast.
 */
export type AccessCastOfflinePack = {
  schemaVersion: 1;
  packKind: "accesscast_offline_outlook";
  forecastId: string;
  missionId: string;
  placeRef: string;
  journeyLabel: string;
  /** When this offline pack was generated / saved. */
  generatedAt: string;
  /** After this time the pack is expired — show stale, do not claim current. */
  expiresAt: string;
  intendedJourneyTime: string;
  conclusionState: AccessCastState;
  plainLanguageSummary: string;
  why: string[];
  suggestedChecks: string[];
  timelinePlainText: string;
  segmentSummaries: Array<{
    id: string;
    label: string;
    state: AccessCastState;
    evidenceSummary: string;
  }>;
  fallbackSummary: string | null;
  confidenceHorizon: string;
  /** Content hash at save time — used for changed-since-saved detection. */
  contentHash: string;
  limitations: string[];
  /** Always true for offline packs. */
  offlineBounded: true;
  /** Always true — never claim live freshness while offline. */
  mustShowGeneratedAndExpiry: true;
  /** Redacted — no home address, no diagnosis. */
  redacted: true;
  synthetic: boolean;
  productionClaim: "none";
};

export type AccessCastOfflineLoadResult = {
  pack: AccessCastOfflinePack;
  /** Wall clock used for evaluation. */
  asOf: string;
  isExpired: boolean;
  /** True when a newer server/synthetic forecast differs from saved hash. */
  changedSinceSaved: boolean;
  /** Authoritative display state — expired packs become stale. */
  displayState: AccessCastState;
  displayLimitations: string[];
  /** Human-readable status for Companion UI. */
  statusLabel: string;
};

/** Hash pack content. `contentHash` on a full pack is ignored if present. */
export function hashAccessCastOfflineContent(
  pack: Omit<AccessCastOfflinePack, "contentHash"> | AccessCastOfflinePack,
): string {
  const {
    forecastId,
    missionId,
    conclusionState,
    intendedJourneyTime,
    why,
    suggestedChecks,
    segmentSummaries,
    expiresAt,
  } = pack;
  const payload = {
    forecastId,
    missionId,
    conclusionState,
    intendedJourneyTime,
    why,
    suggestedChecks,
    segmentSummaries,
    expiresAt,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Compile an offline AccessCast projection from a Starting Work journey result.
 */
export function compileAccessCastOfflinePack(input?: {
  journey?: StartingWorkJourneyInput;
  result?: AccessCastResult;
  missionId?: string;
  generatedAt?: string;
  ttlHours?: number;
}): AccessCastOfflinePack {
  const journey = runStartingWorkJourneyAccessCast(input?.journey ?? {});
  const result = input?.result ?? journey.result;
  const generatedAt = input?.generatedAt ?? result.envelope.forecastGenerationTime;
  const ttlHours = Math.min(Math.max(input?.ttlHours ?? 6, 1), 48);
  const expiresAt =
    result.envelope.expiry &&
    new Date(result.envelope.expiry).getTime() > new Date(generatedAt).getTime()
      ? result.envelope.expiry
      : new Date(new Date(generatedAt).getTime() + ttlHours * 3600_000).toISOString();

  const base: Omit<AccessCastOfflinePack, "contentHash"> = {
    schemaVersion: 1,
    packKind: "accesscast_offline_outlook",
    forecastId: result.envelope.forecastId,
    missionId: input?.missionId ?? journey.missionId,
    placeRef: journey.placeRef,
    journeyLabel: "Home to Harbour Civic Centre, Room 3.12",
    generatedAt,
    expiresAt,
    intendedJourneyTime: result.envelope.intendedJourneyTime,
    conclusionState: result.envelope.conclusionState,
    plainLanguageSummary: result.plainLanguageSummary,
    why: result.why,
    suggestedChecks: result.suggestedChecks,
    timelinePlainText: journey.timelinePlainText,
    segmentSummaries: result.segments.map((s) => ({
      id: s.id,
      label: s.label,
      state: s.currentState,
      evidenceSummary: s.evidenceSummary,
    })),
    fallbackSummary: result.envelope.fallback?.summary ?? null,
    confidenceHorizon: result.envelope.confidenceHorizon,
    limitations: [
      ...result.envelope.limitations,
      "Offline AccessCast — sources may not have been refreshed",
      "Do not treat this pack as a current live forecast after expiry",
    ],
    offlineBounded: true,
    mustShowGeneratedAndExpiry: true,
    redacted: true,
    synthetic: result.envelope.synthetic,
    productionClaim: "none",
  };

  return {
    ...base,
    contentHash: hashAccessCastOfflineContent(base),
  };
}

/**
 * Evaluate a saved offline pack for Companion display.
 * Expired packs surface as stale and never as silently current.
 */
export function evaluateAccessCastOfflinePack(input: {
  saved: AccessCastOfflinePack;
  asOf?: string;
  /** Optional newer pack hash from a refresh attempt (online). */
  latestContentHash?: string | null;
}): AccessCastOfflineLoadResult {
  const asOf = input.asOf ?? new Date().toISOString();
  const isExpired = new Date(asOf).getTime() > new Date(input.saved.expiresAt).getTime();
  const changedSinceSaved =
    typeof input.latestContentHash === "string" &&
    input.latestContentHash.length > 0 &&
    input.latestContentHash !== input.saved.contentHash;

  const displayState: AccessCastState = isExpired
    ? "stale"
    : input.saved.conclusionState;

  const displayLimitations = [
    ...input.saved.limitations,
    `Generated at ${input.saved.generatedAt}`,
    `Expires at ${input.saved.expiresAt}`,
  ];
  if (isExpired) {
    displayLimitations.push(
      "This offline AccessCast has expired — reconnect to refresh before relying on it",
    );
  }
  if (changedSinceSaved) {
    displayLimitations.push(
      "Access outlook has changed since this pack was saved — refresh when online",
    );
  }

  let statusLabel = "Saved offline AccessCast";
  if (isExpired) {
    statusLabel = "Expired offline AccessCast — not current";
  } else if (changedSinceSaved) {
    statusLabel = "Saved AccessCast — newer outlook available";
  } else {
    statusLabel = `Offline AccessCast (saved ${input.saved.generatedAt})`;
  }

  return {
    pack: input.saved,
    asOf,
    isExpired,
    changedSinceSaved,
    displayState,
    displayLimitations,
    statusLabel,
  };
}

/**
 * Secure local storage contract for Companion.
 * Native runtime must bind expo-secure-store (or equivalent); never plain AsyncStorage.
 */
export type AccessCastEncryptedStore = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  deleteItem(key: string): Promise<void>;
};

const memory = new Map<string, string>();

export const memoryAccessCastEncryptedStore: AccessCastEncryptedStore = {
  async setItem(key, value) {
    memory.set(key, value);
  },
  async getItem(key) {
    return memory.get(key) ?? null;
  },
  async deleteItem(key) {
    memory.delete(key);
  },
};

let activeStore: AccessCastEncryptedStore = memoryAccessCastEncryptedStore;

export function setAccessCastEncryptedStore(store: AccessCastEncryptedStore): void {
  activeStore = store;
}

export function getAccessCastEncryptedStore(): AccessCastEncryptedStore {
  return activeStore;
}

export async function saveAccessCastOfflineLocal(
  pack: AccessCastOfflinePack,
): Promise<void> {
  await getAccessCastEncryptedStore().setItem(
    ACCESSCAST_OFFLINE_STORAGE_KEY,
    JSON.stringify(pack),
  );
}

export async function loadAccessCastOfflineLocal(): Promise<AccessCastOfflinePack | null> {
  const raw = await getAccessCastEncryptedStore().getItem(ACCESSCAST_OFFLINE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AccessCastOfflinePack;
  } catch {
    return null;
  }
}

export async function clearAccessCastOfflineLocal(): Promise<void> {
  await getAccessCastEncryptedStore().deleteItem(ACCESSCAST_OFFLINE_STORAGE_KEY);
}

export function __resetAccessCastOfflineStoreForTests(): void {
  memory.clear();
  activeStore = memoryAccessCastEncryptedStore;
}
