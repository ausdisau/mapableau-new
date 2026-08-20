# MapAble Ad Manager

Pre-register + human vetting workflow for organisation advertisers.

## Workflow

```text
Org member creates advertiser (DRAFT)
  → draft campaign + creative
  → submit creative (PENDING_REVIEW)
  → MapAble admin Approve (APPROVED) or Reject (REJECTED)
  → MapAble admin Activate (ACTIVE)  [ops only]
  → Placement engine may serve only when MAPABLE_ADS_* serving flags are on
```

Advertisers **cannot** set `APPROVED` or `ACTIVE`.

## Flags

```env
MAPABLE_ADS_MANAGER_ENABLED=false
NEXT_PUBLIC_MAPABLE_ADS_MANAGER_ENABLED=false
```

Manager is independent of serving flags. Disabling the manager does not change Access/Provider Finder.

## Roles

| Actor | Can |
|-------|-----|
| Org member (`care:manage:org`) | Pre-register advertiser linked to their org; draft; submit for review |
| MapAble admin | Review queue; approve/reject; activate; pause advertiser |

## Surfaces

- Provider: `/provider/ads`, `/provider/ads/new`, `/provider/ads/campaigns/[id]`
- Admin: `/admin/ads/reviews`
- APIs: `/api/ads/manager/*`, `/api/admin/ads/reviews`

## Privacy / fairness

- No auto-publish
- Claim flags (accessibility, NDIS, etc.) require human review
- Sponsored placement still never changes accessibility scores or organic ranking
