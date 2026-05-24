/** Normalized OAuth provider ids stored in AuthIdentityLink */
export type AuthProviderId = "google" | "microsoft" | "email" | "credentials";

const NEXTAUTH_TO_AUTH_PROVIDER: Record<string, AuthProviderId> = {
  google: "google",
  "azure-ad": "microsoft",
  credentials: "credentials",
  email: "email",
};

export function normalizeAuthProvider(
  nextAuthProviderId: string,
): AuthProviderId {
  if (nextAuthProviderId === "microsoft") return "microsoft";
  return NEXTAUTH_TO_AUTH_PROVIDER[nextAuthProviderId] ?? "email";
}

export function authProviderLabel(provider: AuthProviderId): string {
  const labels: Record<AuthProviderId, string> = {
    google: "Google",
    microsoft: "Microsoft",
    email: "Email",
    credentials: "Email and password",
  };
  return labels[provider] ?? provider;
}

export function isOAuthProvider(provider: AuthProviderId): boolean {
  return provider === "google" || provider === "microsoft";
}
