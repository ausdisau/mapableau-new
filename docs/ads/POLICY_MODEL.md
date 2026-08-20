# Policy Model

`AdPolicyEngine` (`lib/ads/policy/policy-engine.ts`) evaluates:

- feature flags / global kill switch
- surface and placement enablement
- provider enablement and exclusivity conflicts
- advertiser / campaign / creative status
- required consent
- destination URL safety

Returns `{ allowed: true }` or `{ allowed: false, reasonCode }`.

## Ranking

`rankCampaigns` uses placement compatibility, schedule, region, category, geometry, priority, and house flag. **Prohibited factors:** disability, health, funding, NDIS, clinical need, vulnerability, accessibility score, provider suitability/safety scores, organic search rank, review manipulation.

## Creative moderation

`DRAFT → PENDING_REVIEW → APPROVED → ACTIVE`. Claim keywords (accessibility, NDIS, healthcare, accreditation, guarantees, etc.) are flagged for human review — never auto-approved.

## Mediation

`buildMediationPolicy` is configuration-driven. EthicalAds exclusive mode suppresses Google on the same page.
