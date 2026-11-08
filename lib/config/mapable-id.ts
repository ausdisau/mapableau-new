function enabled(name: string) {
  return process.env[name] === "true";
}

/** MapAbleID dashboard + read-only identity API (v0.3). Default off. */
export const mapableIdConfig = {
  dashboardEnabled: enabled("MAPABLE_ID_DASHBOARD_ENABLED"),
  /**
   * Canonical NextAuth session issuer label for MapAbleID policy checks.
   * Not a network URL — NextAuth JWT strategy has no OIDC issuer claim by default.
   */
  trustedIssuers: ["mapable:nextauth"] as const,
  audience: "mapable-id",
  /** AD.iD / Google MFA / live federation remain disabled in this slice. */
  adidFederationEnabled: false,
  googleIdentityMfaEnabled: false,
  webauthnEnrolmentMutationsEnabled: false,
} as const;

export type MapAbleIdConfig = typeof mapableIdConfig;
