/**
 * Object storage feature flags and bucket configuration.
 * All product flags default OFF. Enabling code does not make storage
 * production-ready (malware scanning is opt-in and unset by default;
 * rate limits are process-local).
 */

function envTruthy(key: string, environment: NodeJS.ProcessEnv): boolean {
  const v = environment[key];
  return v === "1" || v === "true" || v === "yes";
}

function optionalTrim(
  environment: NodeJS.ProcessEnv,
  key: string,
): string | undefined {
  const value = environment[key]?.trim();
  return value ? value : undefined;
}

export type CloudStorageProviderName =
  | "recording"
  | "s3"
  | "supabase"
  | "memory";

export function parseCloudStorageProvider(
  raw: string | undefined,
): CloudStorageProviderName {
  const value = (raw ?? "recording").trim().toLowerCase();
  if (
    value === "recording" ||
    value === "s3" ||
    value === "supabase" ||
    value === "memory"
  ) {
    return value;
  }
  return "recording";
}

export function getObjectStorageConfig(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const evidenceMaxMb = Number(
    environment.MAPABLE_STORAGE_EVIDENCE_MAX_MB ??
      environment.DOCUMENT_MAX_UPLOAD_MB ??
      "10",
  );

  return {
    enabled: envTruthy("MAPABLE_OBJECT_STORAGE_ENABLED", environment),
    accessEvidenceUploadsEnabled: envTruthy(
      "MAPABLE_ACCESS_EVIDENCE_UPLOADS_ENABLED",
      environment,
    ),
    documentObjectStorageEnabled: envTruthy(
      "MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED",
      environment,
    ),
    requireMalwareScan: envTruthy(
      "MAPABLE_STORAGE_REQUIRE_MALWARE_SCAN",
      environment,
    ),
    malwareScanUrl: optionalTrim(environment, "MAPABLE_MALWARE_SCAN_URL"),
    provider: parseCloudStorageProvider(environment.CLOUD_STORAGE_PROVIDER),
    publicBucket: optionalTrim(environment, "MAPABLE_STORAGE_PUBLIC_BUCKET"),
    privateBucket: optionalTrim(environment, "MAPABLE_STORAGE_PRIVATE_BUCKET"),
    evidenceBucket: optionalTrim(environment, "MAPABLE_STORAGE_EVIDENCE_BUCKET"),
    legacySupabaseBucket: optionalTrim(environment, "SUPABASE_STORAGE_BUCKET"),
    evidenceMaxUploadMb: Number.isFinite(evidenceMaxMb) ? evidenceMaxMb : 10,
    signedUploadTtlSeconds: 900,
    signedReadTtlSeconds: 300,
    uploadSessionTtlSeconds: 900,
    orphanTtlHours: 24,
  };
}

export function isObjectStorageEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return getObjectStorageConfig(environment).enabled;
}

/**
 * Care Document bytes go to ObjectStore only when all three are set.
 * Default remains local disk (`DOCUMENT_STORAGE_MODE=local`).
 */
export function isDocumentObjectStoreEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const mode = (environment.DOCUMENT_STORAGE_MODE ?? "local")
    .trim()
    .toLowerCase();
  const config = getObjectStorageConfig(environment);
  return (
    mode === "object_store" &&
    config.enabled &&
    config.documentObjectStorageEnabled
  );
}
