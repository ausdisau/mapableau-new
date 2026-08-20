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

## Measurement

First-party impressions/clicks store privacy-minimised fields only (placement, provider, campaign id, anonymous session ref). No persistent advertising identity on user accounts.
