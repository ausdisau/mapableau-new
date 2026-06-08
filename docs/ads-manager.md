# MapAble Ads Manager

First-party self-serve advertising for verified disability-sector organisations. Ads are clearly labelled, accessible, contextually targeted, and moderated before going live.

## Eligibility

### Allowed advertiser categories

- NDIS providers
- Allied health providers
- Support coordinators
- Plan managers
- Accessible transport operators
- Assistive technology suppliers
- Inclusive employers
- Accessible tourism providers
- Disability education / training providers
- Councils and public interest campaigns

### Banned content (policy engine)

- Gambling, high-interest lending, miracle cures, weight-loss pressure
- Exploitative disability messaging or misleading NDIS claims
- Fake urgency about NDIS funds
- Ads portraying disabled people as burdens or tragedies

Organisations must have `verificationStatus === verified` before submitting campaigns.

## Campaign lifecycle

1. **draft** — build targeting and creatives
2. **pending_payment** — invoice created; pay via Stripe Checkout (`private_card` / org invoice — not plan-managed NDIS)
3. **pending_review** — webhook marks invoice paid
4. **approved** → **active** — admin approves; system activates when within schedule
5. **paused** / **ended** — budget or end date

Campaigns never serve until **paid** and **admin approved**.

## Contextual targeting (allowed)

- Placement (`skyscraper_left`, `skyscraper_right`, `sponsored_provider_card`, `banner_inline`)
- Page context (e.g. `provider_finder`)
- Service category
- Geography (state codes)
- Device type
- Date range (`startAt` / `endAt`)

## Never allowed in targeting

Disability type, diagnosis, health condition, NDIS plan value, mobility aid, support needs, age vulnerability, carer stress, or any participant profile data.

## API routes

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/api/ads/advertiser` | Session |
| GET/POST | `/api/ads/campaigns` | Session |
| GET/PATCH | `/api/ads/campaigns/[id]` | Session |
| POST | `/api/ads/campaigns/[id]/creatives` | Session |
| POST | `/api/ads/campaigns/[id]/submit` | Session |
| POST | `/api/ads/campaigns/[id]/checkout` | Session |
| GET | `/api/ads/campaigns/[id]/report` | Session |
| POST | `/api/ads/creatives/upload` | Session |
| GET | `/api/ads/serve` | Public |
| POST | `/api/ads/track` | Public |
| GET | `/api/admin/ads/campaigns` | Admin |
| POST | `/api/admin/ads/campaigns/[id]/moderate` | Admin |

## Billing

- Service type: `advertising` on `BillingInvoice`
- Line item metadata: `{ adCampaignId }`
- Default package: `ADS_CAMPAIGN_PACKAGE_CENTS` (default 49900 = $499 AUD)
- Stripe webhook calls `handleAdInvoicePaid` → `pending_review`

## Privacy & metrics

Only **anonymous daily aggregates** are stored in `AdMetricsDaily` (date, placement, coarse region, device type). No per-user or participant-level impression logs.

## UI

- Advertiser portal: `/provider/ads`
- Admin moderation: `/admin/ads`
- Provider Finder: skyscraper slots (2xl+) and sponsored in-feed cards

## Accessibility

- All units show an **Advertisement** or **Sponsored** label
- Creatives require descriptive **alt text** (minimum 10 characters)
- Focusable CTAs with descriptive `aria-label` where needed

## Permissions

- `ads:manage:org` — provider_admin, employer, plan_manager
- `ads:report:org` — same roles
- `ads:moderate:any` — mapable_admin

## Development

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma db seed   # optional demo via seed-ads-demo
```
