const PUBLIC_KEY_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export type SupabasePublicKeyEnvName = (typeof PUBLIC_KEY_ENV_NAMES)[number];

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
  keyEnvName: SupabasePublicKeyEnvName;
};

function readTrimmedEnv(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() ? value.trim() : undefined;
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = readTrimmedEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!url) return null;

  for (const keyEnvName of PUBLIC_KEY_ENV_NAMES) {
    const publishableKey = readTrimmedEnv(keyEnvName);
    if (publishableKey) {
      return { url, publishableKey, keyEnvName };
    }
  }

  return null;
}

export function requireSupabasePublicConfig(): SupabasePublicConfig {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      "Supabase public config requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return config;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return readTrimmedEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function requireSupabaseServiceRoleKey(): string {
  const key = getSupabaseServiceRoleKey();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase access",
    );
  }
  return key;
}

export function getSupabaseStorageBucket(): string | undefined {
  return readTrimmedEnv("SUPABASE_STORAGE_BUCKET");
}

export function requireSupabaseStorageBucket(): string {
  const bucket = getSupabaseStorageBucket();
  if (!bucket) {
    throw new Error(
      "SUPABASE_STORAGE_BUCKET is required when document storage uses Supabase",
    );
  }
  return bucket;
}

export function isSupabaseProjectConfigured(): boolean {
  return Boolean(getSupabasePublicConfig() && getSupabaseServiceRoleKey());
}

export function isSupabaseRealtimeConfigured(): boolean {
  return Boolean(getSupabasePublicConfig());
}

export function getSupabasePublicKeyEnvNames(): readonly SupabasePublicKeyEnvName[] {
  return PUBLIC_KEY_ENV_NAMES;
}
