/**
 * In-process passport projection cache with revocation-aware invalidation.
 * Production deployments should back this with Redis; the SLA contract is stable.
 */

export const REVOCATION_PROPAGATION_SLA_MS = 60_000;

type CacheEntry<T> = {
  value: T;
  cachedAtMs: number;
  generation: number;
};

type ParticipantCacheState = {
  revocationGeneration: number;
  lastRevokedAtMs: number | null;
};

const participantState = new Map<string, ParticipantCacheState>();
const projectionCache = new Map<string, CacheEntry<unknown>>();

function cacheKey(participantId: string, projectionId: string): string {
  return `${participantId}:${projectionId}`;
}

function getParticipantState(participantId: string): ParticipantCacheState {
  let state = participantState.get(participantId);
  if (!state) {
    state = { revocationGeneration: 0, lastRevokedAtMs: null };
    participantState.set(participantId, state);
  }
  return state;
}

export function invalidatePassportProjectionCache(participantId: string): {
  revokedAtMs: number;
  generation: number;
} {
  const state = getParticipantState(participantId);
  state.revocationGeneration += 1;
  state.lastRevokedAtMs = Date.now();

  for (const key of projectionCache.keys()) {
    if (key.startsWith(`${participantId}:`)) {
      projectionCache.delete(key);
    }
  }

  return {
    revokedAtMs: state.lastRevokedAtMs,
    generation: state.revocationGeneration,
  };
}

export function setPassportProjection<T>(
  participantId: string,
  projectionId: string,
  value: T,
): void {
  const state = getParticipantState(participantId);
  projectionCache.set(cacheKey(participantId, projectionId), {
    value,
    cachedAtMs: Date.now(),
    generation: state.revocationGeneration,
  });
}

export function getPassportProjection<T>(
  participantId: string,
  projectionId: string,
): T | null {
  const state = getParticipantState(participantId);
  const entry = projectionCache.get(cacheKey(participantId, projectionId)) as
    | CacheEntry<T>
    | undefined;

  if (!entry) return null;
  if (entry.generation !== state.revocationGeneration) return null;
  return entry.value;
}

export function isPassportProjectionCacheValid(
  participantId: string,
  projectionId: string,
): boolean {
  return getPassportProjection(participantId, projectionId) !== null;
}

export function getRevocationState(participantId: string): ParticipantCacheState {
  return { ...getParticipantState(participantId) };
}

/** Test helper — clears all in-process cache state. */
export function resetPassportProjectionCacheForTests(): void {
  participantState.clear();
  projectionCache.clear();
}

export function assertRevocationPropagatedWithinSla(input: {
  participantId: string;
  projectionId: string;
  revokedAtMs: number;
  nowMs?: number;
}): boolean {
  const now = input.nowMs ?? Date.now();
  const elapsed = now - input.revokedAtMs;
  if (elapsed > REVOCATION_PROPAGATION_SLA_MS) {
    return !isPassportProjectionCacheValid(input.participantId, input.projectionId);
  }
  return !isPassportProjectionCacheValid(input.participantId, input.projectionId);
}
