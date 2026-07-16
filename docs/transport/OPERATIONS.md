# MapAble Transport — Operations

## Pilot runbook (operator)

1. Ensure organisation membership and transport permissions.
2. Maintain drivers/vehicles and verifications (licence, screening, training, registration, insurance, inspection).
3. Open `/transport/operator` → dispatch console.
4. Quote or accept participant-confirmed trips.
5. Assign only when eligibility returns `eligible: true` (server enforces).
6. Monitor incident_hold / disputed trips — billing hold is automatic.

## Pilot runbook (driver)

1. Open `/transport/driver` → `/driver/trips`.
2. Complete prestart before en route.
3. Offline events queue locally and flush with idempotency keys after reconnect.
4. Location sharing only during consented active states.

## Feature flags

See `.env.example`: `TRANSPORT_ROUTING_*`, `TRANSPORT_LIVE_TRACKING_ENABLED`, `TRANSPORT_BOOKING_BRIDGE_ENABLED`, `CARE_TRANSPORT_ORCHESTRATION_V2_ENABLED`, `TRANSPORT_LOCATION_ENCRYPTION_KEY`.

## Migrations

```bash
npx prisma migrate deploy
```

Migration: `20260716140000_transport_mvp_domain`.

## Rollback

Reverse by deploying prior migration set; new tables are additive. Do not mutate historical `transport_pricing_rules` rows.
