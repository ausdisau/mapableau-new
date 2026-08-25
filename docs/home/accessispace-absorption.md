# AccessiSpace absorption into MapAble Home

**Status:** Historical development prototype absorbed into MapAble Home / Home and Living.  
**Not:** a separate production app, database, auth system, deployment, or top-level MapAble vertical.

## Claim state

AccessiSpace is recorded as a **HISTORICAL DEVELOPMENT PROTOTYPE**.  
It must not be described as previously live or production-ready.  
Marketing metrics (e.g. “100+ Verified Properties”) are **retired** unless independently evidenced.

## Salvaged concepts → MapAble owners

| Salvaged concept | New MapAble owner | Migration status |
| --- | --- | --- |
| Property | `AccessibleProperty` in Home and Living | adapted |
| Vacancy / listing | `PropertyVacancy` (property ≠ vacancy) | adapted |
| Provider listing management | Provider home listing APIs (flagged) | adapted |
| Participant search / filters | `/home/find` + discovery service | adapted |
| Accessibility features / evidence | `PropertyAccessibilityEvidence` + normalizer | adapted |
| Property images / virtual tour URL | `PropertyListingMedia` + `virtualTourUrl` | adapted |
| Comparison | `/home/compare` (no suitability score) | adapted |
| Shortlist | `HomeShortlistItem` | adapted |
| Enquiry | `HomeEnquiry` + existing `Conversation` / `Message` | adapted |
| Home capability notes | `HomeCapabilityProfile` (descriptive only) | adapted |
| Participant requirements | Existing `HomeLivingProfile` | preserved |

## Explicitly retired

| AccessiSpace item | Status |
| --- | --- |
| Replit Auth / custom OAuth / Wix SSO | retired |
| Drizzle schema / Vite+Express shell | retired |
| Duplicate user / provider / messaging / upload stacks | retired |
| Wildcard OAuth redirects / client secrets as app data | retired |
| Generic `isVerified` as trust proof | retired |
| Homes as Marketplace products | never adopted |
| Bundled housing + support requirement | never adopted |
| Suitability / NDIS eligibility algorithms | never adopted |
| Live smart-home / Matter / Alexa / Google control | deferred |

## Boundaries preserved

- Homes and vacancies are **not** `MarketplaceProduct` records.
- Property and personal support remain separate dependencies.
- Preferences do not determine funding eligibility.
- Living preferences are not inferred from diagnosis.
- Marketing claims stay unverified until evidence records say otherwise.
- Shortlist / compare never auto-share `HomeLivingProfile`.
- Enquiry may share only explicitly selected requirement keys.

## Feature flags (fail-closed)

- `MAPABLE_HOME_LIVING_ENABLED`
- `MAPABLE_HOME_DISCOVERY_ENABLED`
- `MAPABLE_HOME_COMPARE_ENABLED`
- `MAPABLE_HOME_ENQUIRIES_ENABLED`
- `MAPABLE_HOME_PROVIDER_LISTINGS_ENABLED`
- `MAPABLE_HOME_CAPABILITY_PROFILE_ENABLED`

## Public routes (this PR)

- `/home` — MapAble Home landing (Available / In development / Proposed)
- `/home/find` — search
- `/home/properties/[id]` — detail + evidence + unknowns
- `/home/compare` — up to four homes

Participant: shortlist under `/participant/home-and-living/shortlist` (requirements remain on existing Home and Living page).
