import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";

export function getDeputyOAuthConfig() {
  return {
    enabled: integrationsFeatureFlags.deputyEnabled(),
    clientId: process.env.DEPUTY_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.DEPUTY_CLIENT_SECRET?.trim() ?? "",
    redirectUri: process.env.DEPUTY_OAUTH_REDIRECT_URI?.trim() ?? "",
    webhookMode: integrationsFeatureFlags.deputyWebhookVerificationMode(),
    webhookSecret: process.env.DEPUTY_WEBHOOK_SECRET?.trim() ?? "",
  };
}

export function assertDeputyConfigured(): void {
  const cfg = getDeputyOAuthConfig();
  if (!cfg.enabled) {
    throw new Error("DEPUTY_ENABLED is false");
  }
  if (!cfg.clientId || !cfg.clientSecret || !cfg.redirectUri) {
    throw new Error(
      "Deputy OAuth requires DEPUTY_CLIENT_ID, DEPUTY_CLIENT_SECRET, DEPUTY_OAUTH_REDIRECT_URI",
    );
  }
}
