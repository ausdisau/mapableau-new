import { isDemoMode } from "../configuration";

import {
  getMemoryLivingPersistence,
  resetMemoryLivingPersistenceForTests,
} from "./memory";
import { PrismaLivingPersistence } from "./prisma-living";
import type { LivingPersistence } from "./types";

export function prismaLivingPersistenceEnabled(): boolean {
  return (
    process.env.ACCESS_INTELLIGENCE_USE_PRISMA === "true" &&
    !isDemoMode()
  );
}

let prismaSingleton: LivingPersistence | null = null;

/**
 * Factory: Prisma when ACCESS_INTELLIGENCE_USE_PRISMA=true and demo mode off;
 * otherwise durable-enough in-memory persistence for local/demo.
 */
export function getLivingPersistence(): LivingPersistence {
  if (prismaLivingPersistenceEnabled()) {
    if (!prismaSingleton) prismaSingleton = new PrismaLivingPersistence();
    return prismaSingleton;
  }
  return getMemoryLivingPersistence();
}

export function resetLivingPersistenceForTests(): void {
  prismaSingleton = null;
  resetMemoryLivingPersistenceForTests();
}

export type {
  LearningSessionRecord,
  LiveStatusSnapshot,
  LivingPersistence,
  MutationDraftRecord,
  VenueStaffAssignment,
  VenueStaffRole,
} from "./types";
export { MemoryLivingPersistence } from "./memory";
export { PrismaLivingPersistence } from "./prisma-living";
