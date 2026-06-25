export type ProductAnalyticsProperties = Record<
  string,
  string | number | boolean | undefined
>;

const SENSITIVE_FIELD_PATTERN =
  /access|need|disability|ndis|health|diagnosis|address|phone|message|free_?text/i;

const BLOCKED_KEYS = new Set([
  "accessNeeds",
  "access_needs",
  "accessNeedsOrInterest",
  "disabilityType",
  "ndisNumber",
  "address",
  "phone",
  "message",
  "freeText",
]);

let analyticsConsentGranted = false;
let identifiedUserId: string | null = null;

export function setConsentState(granted: boolean): void {
  analyticsConsentGranted = granted;
  if (!granted) {
    identifiedUserId = null;
  }
}

export function getConsentState(): boolean {
  return analyticsConsentGranted;
}

export function identifyUser(userId: string): void {
  if (!analyticsConsentGranted) return;
  identifiedUserId = userId;
}

export function isProductAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true";
}

export function sanitizeAnalyticsProperties(
  properties?: ProductAnalyticsProperties,
): ProductAnalyticsProperties {
  if (!properties) return {};
  const sanitized: ProductAnalyticsProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    if (BLOCKED_KEYS.has(key) || SENSITIVE_FIELD_PATTERN.test(key)) {
      continue;
    }
    if (typeof value === "string" && value.length > 120) {
      sanitized[key] = value.slice(0, 120);
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export function bucketLocation(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) return "unknown";
  const postcodeMatch = trimmed.match(/\b(\d{4})\b/);
  if (postcodeMatch) {
    return `postcode_${postcodeMatch[1].slice(0, 2)}xx`;
  }
  const parts = trimmed.split(/[,\s]+/).filter(Boolean);
  return parts[parts.length - 1]?.toLowerCase() ?? "unknown";
}

export function trackProductEvent(
  eventName: string,
  properties?: ProductAnalyticsProperties,
): void {
  const sanitized = sanitizeAnalyticsProperties(properties);

  if (typeof window === "undefined") {
    if (process.env.NODE_ENV === "development") {
      console.debug("[product-analytics]", eventName, sanitized);
    }
    return;
  }

  if (!isProductAnalyticsEnabled() || !analyticsConsentGranted) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[product-analytics]", eventName, sanitized);
    }
    return;
  }

  const detail = {
    event: eventName,
    properties: sanitized,
    userId: identifiedUserId ?? undefined,
  };
  window.dispatchEvent(new CustomEvent("mapable-analytics", { detail }));

  if (process.env.NODE_ENV === "development") {
    console.debug("[product-analytics]", eventName, sanitized);
  }
}

/** @deprecated Use trackProductEvent — alias for Prompt Pack naming */
export const trackEvent = trackProductEvent;
