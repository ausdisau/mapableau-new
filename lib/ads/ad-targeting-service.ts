import type { AdTargetingRuleKind } from "@/types/ads";
import {
  PROHIBITED_TARGETING_FIELDS,
  type AdSearchContext,
  type MapViewport,
} from "@/types/ads";

export interface TargetingRuleRecord {
  ruleKind: AdTargetingRuleKind;
  ruleValue: Record<string, unknown>;
}

export function assertSafeTargetingPayload(
  payload: Record<string, unknown>,
): void {
  for (const key of Object.keys(payload)) {
    const normalized = key.toLowerCase().replace(/[\s-]/g, "_");
    if (
      PROHIBITED_TARGETING_FIELDS.some(
        (field) => normalized.includes(field) || field.includes(normalized),
      )
    ) {
      throw new Error(`PROHIBITED_TARGETING_FIELD:${key}`);
    }
  }
}

function pointInViewport(
  lat: number,
  lng: number,
  viewport: MapViewport,
): boolean {
  return (
    lat <= viewport.north &&
    lat >= viewport.south &&
    lng <= viewport.east &&
    lng >= viewport.west
  );
}

function matchServiceCategory(
  ruleValue: Record<string, unknown>,
  context: AdSearchContext,
): boolean {
  const categories = Array.isArray(ruleValue.categories)
    ? (ruleValue.categories as string[])
    : [];
  if (categories.length === 0) return true;
  const ctxCategories = context.serviceCategories ?? [];
  if (ctxCategories.length === 0) return false;
  return categories.some((c) =>
    ctxCategories.some((ctx) => ctx.toLowerCase().includes(c.toLowerCase())),
  );
}

function matchSuburbPostcode(
  ruleValue: Record<string, unknown>,
  context: AdSearchContext,
): boolean {
  const suburbs = Array.isArray(ruleValue.suburbs)
    ? (ruleValue.suburbs as string[])
    : [];
  const postcodes = Array.isArray(ruleValue.postcodes)
    ? (ruleValue.postcodes as string[])
    : [];
  if (suburbs.length === 0 && postcodes.length === 0) return true;

  const suburb = context.suburb?.toLowerCase() ?? "";
  const postcode = context.postcode ?? "";
  const suburbMatch =
    suburbs.length === 0 ||
    suburbs.some((s) => suburb.includes(String(s).toLowerCase()));
  const postcodeMatch =
    postcodes.length === 0 || postcodes.some((p) => postcode.startsWith(String(p)));
  return suburbMatch && postcodeMatch;
}

function matchMapViewport(
  ruleValue: Record<string, unknown>,
  context: AdSearchContext,
): boolean {
  if (!context.viewport) return true;
  const lat = typeof ruleValue.latitude === "number" ? ruleValue.latitude : null;
  const lng = typeof ruleValue.longitude === "number" ? ruleValue.longitude : null;
  if (lat == null || lng == null) return true;
  return pointInViewport(lat, lng, context.viewport);
}

function matchAccessFeature(
  ruleValue: Record<string, unknown>,
  context: AdSearchContext,
): boolean {
  const terms = Array.isArray(ruleValue.terms)
    ? (ruleValue.terms as string[])
    : [];
  if (terms.length === 0) return true;
  const ctxTerms = context.accessFeatureTerms ?? [];
  if (ctxTerms.length === 0) return false;
  const haystack = ctxTerms.join(" ").toLowerCase();
  return terms.some((t) => haystack.includes(String(t).toLowerCase()));
}

function matchProviderFinderContext(
  ruleValue: Record<string, unknown>,
  context: AdSearchContext,
): boolean {
  const keywords = Array.isArray(ruleValue.keywords)
    ? (ruleValue.keywords as string[])
    : [];
  if (keywords.length === 0) return true;
  const query = context.providerFinderQuery?.toLowerCase() ?? "";
  if (!query) return false;
  return keywords.some((k) => query.includes(String(k).toLowerCase()));
}

function matchEventCategory(
  ruleValue: Record<string, unknown>,
  context: AdSearchContext,
): boolean {
  const categories = Array.isArray(ruleValue.categories)
    ? (ruleValue.categories as string[])
    : [];
  if (categories.length === 0) return true;
  const ctx = context.eventCategory?.toLowerCase() ?? "";
  if (!ctx) return false;
  return categories.some((c) => ctx.includes(String(c).toLowerCase()));
}

export function ruleMatchesContext(
  rule: TargetingRuleRecord,
  context: AdSearchContext,
): boolean {
  assertSafeTargetingPayload(rule.ruleValue);

  switch (rule.ruleKind) {
    case "service_category":
      return matchServiceCategory(rule.ruleValue, context);
    case "suburb_postcode":
      return matchSuburbPostcode(rule.ruleValue, context);
    case "map_viewport":
      return matchMapViewport(rule.ruleValue, context);
    case "access_feature":
      return matchAccessFeature(rule.ruleValue, context);
    case "provider_finder_context":
      return matchProviderFinderContext(rule.ruleValue, context);
    case "event_category":
      return matchEventCategory(rule.ruleValue, context);
    default:
      return false;
  }
}

export function allRulesMatchContext(
  rules: TargetingRuleRecord[],
  context: AdSearchContext,
): boolean {
  if (rules.length === 0) return true;
  return rules.every((rule) => ruleMatchesContext(rule, context));
}

export function buildTargetingSummary(
  rules: TargetingRuleRecord[],
): string[] {
  return rules.map((rule) => {
    switch (rule.ruleKind) {
      case "service_category":
        return "Matched service category";
      case "suburb_postcode":
        return "Matched location area";
      case "map_viewport":
        return "Visible in your map area";
      case "access_feature":
        return "Matched accessibility search";
      case "provider_finder_context":
        return "Matched your provider search";
      case "event_category":
        return "Matched event category";
      default:
        return "Matched search context";
    }
  });
}

export function computeContextRelevance(
  rules: TargetingRuleRecord[],
  context: AdSearchContext,
): number {
  if (rules.length === 0) return 0.5;
  const matches = rules.filter((r) => ruleMatchesContext(r, context)).length;
  return matches / rules.length;
}

export function computeLocationRelevance(
  creativeLat?: number | null,
  creativeLng?: number | null,
  context?: AdSearchContext,
): number {
  if (!context?.viewport || creativeLat == null || creativeLng == null) {
    return 0.5;
  }
  return pointInViewport(creativeLat, creativeLng, context.viewport) ? 1 : 0;
}

export function computeAccessMatch(
  rules: TargetingRuleRecord[],
  context: AdSearchContext,
): number {
  const accessRules = rules.filter((r) => r.ruleKind === "access_feature");
  if (accessRules.length === 0) return 0.5;
  const matched = accessRules.filter((r) => ruleMatchesContext(r, context)).length;
  return matched / accessRules.length;
}
