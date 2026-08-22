/**
 * Personal Agency gate helpers (G0–G5 conceptual model).
 * Server-side checks only — never rely on UI hiding alone.
 */

import { redirect } from "next/navigation";

import type { CurrentUser } from "@/lib/auth/current-user";
import { requireAuth } from "@/lib/auth/guards";
import { personalAgencyFlags } from "@/lib/config/personal-agency";

/** G1+ authenticated account. */
export async function requireAccountGate(): Promise<CurrentUser> {
  return requireAuth();
}

/** G2 personal agency workspace — authenticated + PAI flag. */
export async function requirePersonalAgencyGate(
  redirectTo = "/dashboard",
): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!personalAgencyFlags.routesEnabled) {
    redirect(redirectTo);
  }
  return user;
}

/** G2 life intents — flag + auth. */
export async function requireLifeIntentGate(): Promise<CurrentUser> {
  const user = await requirePersonalAgencyGate();
  if (!personalAgencyFlags.lifeIntentsEnabled) {
    redirect("/my");
  }
  return user;
}
