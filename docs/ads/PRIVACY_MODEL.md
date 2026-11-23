# MapAble Ads Privacy Model

MapAble Ads uses **contextual placement**. Advertising must not use disability, health, NDIS, funding or clinical information for personalised targeting.

## Context split

| InternalAdContext | ExternalAdContext |
|-------------------|-------------------|
| viewportBBox, mapCenter, zoom, searchContext | regionCode, surface, placement, category, zoomBand |

Precise geography is resolved internally, then sanitised via `sanitizeExternalAdContext()` (allowlist only).

## Never send externally

Disability diagnosis/type, participant/NDIS status or numbers, funding, medical/clinical notes, AAC requirements, support notes, precise home address, email/phone, user IDs, precise GPS/history, or hashed stand-ins treated as advertising identifiers.

## Consent

External providers that require consent are gated. MapAble disables personalised targeting for Google Ad Manager on these surfaces (`nonPersonalizedAds` / limited ads).

### Sponsored phrase preference (public Explore pilot)

“Show sponsored links” is a separate, reversible guest preference (`mapable:ads:show-sponsored-links:v1`, default **off**). It is not care consent, personalised-ad consent, or analytics consent.

Phrase selection uses only a closed public route allowlist and a static editorial topic key. It must not receive the current query, draft, speech/AAC text, appointment intent, profile, precise location, plan, account, map bounds, or selected provider. Ad content must not enter model prompts or organic ranking. Preference is client-local so one reader’s choice cannot expose an ad to another.

## Measurement

First-party impressions/clicks store privacy-minimised fields only (placement, provider, campaign id, anonymous session ref). No persistent advertising identity on user accounts.

## Auction & billing privacy

`AdAuctionResult` must **not** store diagnosis, disability profile, NDIS data, raw search query, or participant identity.

Bidding / willingness-to-pay must never cause disclosure of additional participant context. Paid bid affects sponsored inventory only — never accessibility evidence or provider suitability.

CTR prediction uses **aggregate** campaign/placement/creative/context statistics only — never an individual person's behaviour.
