/**
 * Object storage feature flags and bucket configuration.
 * All product flags default OFF. Enabling code does not make storage
 * production-ready (no malware scanning, in-process rate limits).
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
