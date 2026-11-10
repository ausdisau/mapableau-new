import type { Analytics } from "firebase/analytics";
import type { FirebaseApp } from "firebase/app";

import { getFirebaseApp } from "./app.ts";

/**
 * Analytics is browser-only. Safe on SSR, Expo native, and Node: returns null
 * when `window` is missing or Analytics is unsupported.
 */
export async function getFirebaseAnalytics(
  app?: FirebaseApp,
): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;

  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (!(await isSupported())) return null;

  return getAnalytics(app ?? getFirebaseApp());
}
