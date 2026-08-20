# Provider Adapters

Common interface: `AdProviderAdapter` in `lib/ads/providers/adapter.ts`.

## MapAble Internal

| Capability | Value |
|------------|-------|
| mapMarkers | true |
| domSlots | true |
| contextualTargeting | true |
| coarseGeoTargeting | true |
| personalisedTargeting | false |

Status: **Implemented** (feature-flagged off by default). Supports house promotions and direct-sold campaigns.

## Google Ad Manager (GPT)

| Capability | Value |
|------------|-------|
| mapMarkers | false |
| domSlots | true |
| contextualTargeting | true |
| personalisedTargeting | **disabled by MapAble** |

Uses current Google Publisher Tag patterns: load once, `destroySlots` on SPA unmount, limited/non-personalised privacy settings. Network codes via env — never committed.

Status: **Implemented but disabled**. Requires operational GAM account configuration before enablement.

## EthicalAds

| Capability | Value |
|------------|-------|
| mapMarkers | false |
| domSlots | true |
| contextualTargeting | true |
| personalisedTargeting | false |
| requiresExclusivePageMode | true |

When EthicalAds is selected, `pageAdMode = ethicalads_exclusive` and Google/other third-party networks are suppressed on the same page. EthicalAds publisher policy focuses on developer audiences — **MapAble eligibility is not assumed**.

Status: **Implemented but disabled** (eligibility / publisher approval blocked).

## Marketing AdSense

The existing `lib/ads/ad-unit.ts` + footer AdSense path is a **separate** marketing monetisation surface and is not part of Access/Provider Finder mediation.
