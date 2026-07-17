export type RouteProvenance = {
  resolverVersion: string;
  matchedFundingSourceId: string | null;
  matchedServiceAgreementId: string | null;
  fundingSourceType: string | null;
  overrideApplied: boolean;
  overrideReason: string | null;
  decidedAt: string;
  signals: string[];
};

export const ROUTE_RESOLVER_VERSION = "wave4-route-1";

export function buildRouteProvenance(input: {
  matchedFundingSourceId?: string | null;
  matchedServiceAgreementId?: string | null;
  fundingSourceType?: string | null;
  overrideApplied?: boolean;
  overrideReason?: string | null;
  signals?: string[];
}): RouteProvenance {
  return {
    resolverVersion: ROUTE_RESOLVER_VERSION,
    matchedFundingSourceId: input.matchedFundingSourceId ?? null,
    matchedServiceAgreementId: input.matchedServiceAgreementId ?? null,
    fundingSourceType: input.fundingSourceType ?? null,
    overrideApplied: Boolean(input.overrideApplied),
    overrideReason: input.overrideReason ?? null,
    decidedAt: new Date().toISOString(),
    signals: input.signals ?? [],
  };
}
