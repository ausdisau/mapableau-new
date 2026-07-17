# Partner API

## Base path

`/api/partners/v1/`

AccessOps Wave 12 adds a separate scope-based Partner API v2 under
`/api/partners/v2/` for civic assets, status, reliability, observations, and
webhooks. See `docs/accessops/partner-api-v2.md`.

## Authentication

`Authorization: Bearer <api-key>` — keys stored hashed in `partner_api_clients`.

## Scopes

`venues:read`, `floorplans:read`, `status:read`, `accreditation:read`, `embeds:manage`, `webhooks:manage`

## Endpoints

- `GET /venues` — published venue summaries
- `GET /venues/:venueId/floor-plans` — published public floor plans (restricted zones filtered)

## DTO policy

Responses pass through `lib/indoor-accessibility/partner/partner-dto.ts` — no raw DB rows.

## Embed

`public/embed/mapable-viewer.js` — sandboxed iframe to `/accessibility-map`.

## Webhooks

Scaffold: signed payload verification in `lib/indoor-accessibility/partner/api-auth.ts`. Delivery worker not yet implemented.
