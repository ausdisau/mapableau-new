import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";

import {
  type FirebaseClientConfig,
  requireFirebaseClientConfig,
} from "./config.ts";

let cached: FirebaseApp | undefined;

/**
 * Idempotent Firebase app bootstrap for web (Next/Expo web) and native
 * (Expo / React Native) using the modular JS SDK.
 */
export function getFirebaseApp(
  config?: FirebaseClientConfig,
): FirebaseApp {
  if (cached) return cached;
  if (getApps().length > 0) {
    cached = getApp();
    return cached;
  }
  const resolved = config ?? requireFirebaseClientConfig();
  cached = initializeApp(resolved);
  return cached;
}

/** Test helper — clears the module cache between cases. */
export function resetFirebaseAppCacheForTests(): void {
  cached = undefined;
}
