/**
 * Deterministic seeded PRNG for Replay Lab.
 * Randomised tests must retain, print, and support exact replay of the seed.
 */

export type SeededRandom = {
  readonly seed: number;
  next(): number;
  nextInt(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
};

/** Mulberry32 — small, deterministic, sufficient for synthetic scheduling jitter. */
export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed,
    next,
    nextInt(maxExclusive: number) {
      if (maxExclusive <= 0) throw new Error("maxExclusive must be > 0");
      return Math.floor(next() * maxExclusive);
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error("Cannot pick from empty list");
      return items[Math.floor(next() * items.length)]!;
    },
  };
}
