/**
 * Playwright + axe-core vertical-slice checklist.
 *
 * Install (dev):
 *   pnpm add -D @playwright/test @axe-core/playwright
 *   pnpm exec playwright install
 *
 * Then implement:
 * - keyboard-only completion of MapAble Worker Foundations
 * - axe source with no serious/critical violations on catalogue, course, player, certificate
 * - progress survives refresh
 * - unauthorised /academy/studio access redirects/fails closed
 *
 * Do not use real participant data in fixtures.
 */
export const ACADEMY_E2E_CHECKLIST = [
  "catalogue loads seeded MapAble Worker Foundations",
  "course page enrols after sign-in",
  "lesson player keyboard operable, no focus trap",
  "quiz submit immutable",
  "certificate verify public page",
] as const;
