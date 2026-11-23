/**
 * AD.iD Firebase client (analytics / future non-auth products only).
 * Clerk remains the sole AD.iD authentication provider.
 */

import {
  getFirebaseAnalytics,
  getFirebaseApp,
  readFirebaseClientConfig,
} from "@mapable/firebase";

export async function initAdidFirebase() {
  if (!readFirebaseClientConfig()) {
    return { app: null, analytics: null, enabled: false as const };
  }
  const app = getFirebaseApp();
  const analytics = await getFirebaseAnalytics(app);
  return { app, analytics, enabled: true as const };
}
