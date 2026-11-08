# Synthetic vertical slice demo (§14.11)

**Flags (all default false):**

```bash
MAPABLE_ADS_ENABLED=true
MAPABLE_ADS_MANAGER_ENABLED=true
MAPABLE_ADS_PLACEMENT_API_ENABLED=true
MAPABLE_ADS_PROVIDER_DISCOVERY_ENABLED=true
MAPABLE_ADS_DOOH_SANDBOX_ENABLED=true
```

**Flow (no live spend):**

1. Sync catalogue: `POST /api/ads/v1/discovery/sync`
2. Search: `POST /api/ads/v1/placements/search`
3. Quote: `POST /api/ads/v1/quotes` with `Idempotency-Key`
4. Human creative review via manager review API (no self-approval)
5. Order: `POST /api/ads/v1/orders` with mock spend authorisation
6. Reconcile: `GET /api/ads/v1/orders/{id}/reconciliation?advertiserId=…`
7. Export CSV from Ads Manager UI `/provider/ads/manager`

Operator registry UI: `/admin/ads/providers`

Unknown external submission: use DOOH idempotency key suffix `-unknown` in the sandbox adapter to freeze retries.
