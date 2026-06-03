/**
 * Uber for Business — Guest Rides API configuration.
 * @see https://developer.uber.com/docs/guest-rides/guest-ride-api-build-guide/overview
 */
export const uberConfig = {
  clientId: process.env.UBER_CLIENT_ID?.trim(),
  clientSecret: process.env.UBER_CLIENT_SECRET?.trim(),
  organizationUuid: process.env.UBER_ORGANIZATION_UUID?.trim(),
  oauthScope: process.env.UBER_OAUTH_SCOPE?.trim() ?? "guests.trips",
  tokenUrl:
    process.env.UBER_TOKEN_URL?.trim() ??
    "https://login.uber.com/oauth/v2/token",
  useSandbox: process.env.UBER_USE_SANDBOX === "true",
  apiBaseUrl:
    process.env.UBER_API_BASE_URL?.trim() ??
    (process.env.UBER_USE_SANDBOX === "true"
      ? "https://sandbox-api.uber.com"
      : "https://api.uber.com"),
  runUuid: process.env.UBER_SANDBOX_RUN_UUID?.trim(),
};

export function isUberSdkConfigured(): boolean {
  return Boolean(
    uberConfig.clientId &&
      uberConfig.clientSecret &&
      uberConfig.organizationUuid
  );
}

export function isUberIntegrationEnabled(): boolean {
  if (!isUberSdkConfigured()) return false;
  return process.env.UBER_ENABLED === "true";
}

export function uberNotConfiguredResponse() {
  return {
    configured: false,
    message:
      "Uber Guest Rides is not configured. Set UBER_ENABLED=true plus UBER_CLIENT_ID, UBER_CLIENT_SECRET, and UBER_ORGANIZATION_UUID.",
  };
}
