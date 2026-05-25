const FORBIDDEN_METADATA_KEYS =
  /ndis|disability|clinical|diagnosis|invoice|incident|safeguard|support_plan|ephi|phi|billing/i;

/** Ensures sensitive MapAble data is never written to Auth0 user/app metadata */
export function assertIdentityOnlyMetadata(
  metadata: Record<string, unknown> | undefined
): void {
  if (!metadata) return;
  for (const key of Object.keys(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.test(key)) {
      throw new Error(
        `Forbidden Auth0 metadata key "${key}": health/disability data must stay in MapAble`
      );
    }
    const val = metadata[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      assertIdentityOnlyMetadata(val as Record<string, unknown>);
    }
  }
}

export const ALLOWED_GOOGLE_SCOPES = ["openid", "email", "profile"] as const;
