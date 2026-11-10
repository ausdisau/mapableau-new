/**
 * Shared Firebase web/client configuration.
 *
 * Values come from environment variables so the same package works for
 * Next.js (NEXT_PUBLIC_*), Expo (EXPO_PUBLIC_*), and Node tests.
 *
 * Firebase *web* API keys are client-visible by design; still restrict them
 * in Google Cloud Console (HTTP referrers / app IDs) and never commit
 * service-account private keys here.
 */

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function firstEnv(
  env: NodeJS.ProcessEnv,
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = env[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function readFirebaseClientConfig(
  env: NodeJS.ProcessEnv = process.env,
): FirebaseClientConfig | null {
  const apiKey = firstEnv(
    env,
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "FIREBASE_API_KEY",
  );
  const authDomain = firstEnv(
    env,
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "FIREBASE_AUTH_DOMAIN",
  );
  const projectId = firstEnv(
    env,
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_PROJECT_ID",
  );
  const storageBucket = firstEnv(
    env,
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "FIREBASE_STORAGE_BUCKET",
  );
  const messagingSenderId = firstEnv(
    env,
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "FIREBASE_MESSAGING_SENDER_ID",
  );
  const appId = firstEnv(
    env,
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "EXPO_PUBLIC_FIREBASE_APP_ID",
    "FIREBASE_APP_ID",
  );
  const measurementId = firstEnv(
    env,
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
    "EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID",
    "FIREBASE_MEASUREMENT_ID",
  );

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

export function requireFirebaseClientConfig(
  env: NodeJS.ProcessEnv = process.env,
): FirebaseClientConfig {
  const config = readFirebaseClientConfig(env);
  if (!config) {
    throw new Error(
      "Firebase client config missing. Set NEXT_PUBLIC_FIREBASE_* or EXPO_PUBLIC_FIREBASE_* (see packages/firebase/.env.example).",
    );
  }
  return config;
}
