# Skyscraper ad rails

Desktop left/right sponsored slots wrap eligible public pages via `AdRailRootWrapper` in `components/providers.tsx`.

## Eligibility

See `lib/ads/ad-page-eligibility.ts`. Sensitive routes (login, dashboard, billing, clinical, admin, etc.) never show ads.

## APIs

- `GET /api/ads/slots?slotId=&pageContext=`
- `POST /api/ads/events` (impression, click, hidden, reported)

Set `ADS_DISABLED=true` to block creatives.

## Layout

- `xl`: 160px rails
- `2xl`: 300px rails
- Below `xl`: rails hidden; no horizontal scroll
