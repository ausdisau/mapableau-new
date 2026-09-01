/**
 * Native Android mobile API flags — fail-closed (default false).
 * Do not enable in production without owner approval.
 */
export const mobileApiConfig = {
  get apiEnabled() {
    return process.env.MAPABLE_MOBILE_API_ENABLED === "true";
  },
  get authExchangeEnabled() {
    return (
      process.env.MAPABLE_MOBILE_AUTH_EXCHANGE_ENABLED === "true" &&
      this.apiEnabled
    );
  },
  get pushEnabled() {
    return process.env.MAPABLE_MOBILE_PUSH_ENABLED === "true";
  },
  get integrityEnabled() {
    return process.env.MAPABLE_MOBILE_INTEGRITY_ENABLED === "true";
  },
  get fusedLocationEnabled() {
    return process.env.MAPABLE_MOBILE_FUSED_LOCATION_ENABLED === "true";
  },
  get socketIoEnabled() {
    return (
      process.env.SOCKETIO_ENABLED === "true" ||
      process.env.NEXT_PUBLIC_SOCKETIO_ENABLED === "true"
    );
  },
  get minAppVersionCode() {
    const n = Number(process.env.MAPABLE_MOBILE_MIN_VERSION_CODE ?? "1");
    return Number.isFinite(n) && n > 0 ? n : 1;
  },
  get apiBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "https://mapable.com.au";
  },
  /** HMAC secret for MapAble-owned mobile tokens (falls back to NEXTAUTH_SECRET). */
  get tokenSecret() {
    return (
      process.env.MAPABLE_MOBILE_TOKEN_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      ""
    );
  },
  accessTokenTtlSeconds: 60 * 60,
  refreshTokenTtlSeconds: 60 * 60 * 24 * 30,
};

export function isMobileApiEnabled(): boolean {
  return mobileApiConfig.apiEnabled;
}

export function isMobileAuthExchangeEnabled(): boolean {
  return mobileApiConfig.authExchangeEnabled;
}

export function mobileApiDisabledResponse() {
  return {
    enabled: false,
    error: "Mobile API disabled. Set MAPABLE_MOBILE_API_ENABLED=true.",
  };
}
