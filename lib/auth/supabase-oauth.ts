import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

export type SupabaseOAuthProviderId =
  | "google"
  | "azure"
  | "facebook"
  | "apple";

const UI_TO_SUPABASE: Record<
  keyof Omit<OAuthProviderFlags, "auth0">,
  SupabaseOAuthProviderId
> = {
  google: "google",
  microsoft: "azure",
  facebook: "facebook",
  apple: "apple",
};

export function toSupabaseOAuthProvider(
  provider: keyof Omit<OAuthProviderFlags, "auth0">,
): SupabaseOAuthProviderId {
  return UI_TO_SUPABASE[provider];
}

export function supabaseOAuthRedirectTo(callbackUrl: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";

  const next = encodeURIComponent(callbackUrl);
  return `${origin.replace(/\/$/, "")}/auth/callback?next=${next}`;
}
