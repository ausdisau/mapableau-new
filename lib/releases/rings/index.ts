import type { ReleaseRing } from "@prisma/client";

export const RELEASE_RING_ORDER: ReleaseRing[] = [
  "ring_0_internal",
  "ring_1_canary",
  "ring_2_pilot",
  "ring_3_general_limited",
  "ring_4_general",
];

export function ringIndex(ring: ReleaseRing): number {
  return RELEASE_RING_ORDER.indexOf(ring);
}

export function nextRing(ring: ReleaseRing): ReleaseRing | null {
  const idx = ringIndex(ring);
  if (idx < 0) return null;
  return RELEASE_RING_ORDER[idx + 1] ?? null;
}

export function isPromotable(from: ReleaseRing, to: ReleaseRing): boolean {
  return ringIndex(to) === ringIndex(from) + 1;
}
