# Production roadmap

## Shipped

Priority 0 engines + Living Building A–D · Living Prisma path · venue gates · live adapters  
Priority 1: MapAble Verify · Pilot console · entitlements · adapter mocks · portfolio docs  

### Production priorities (this pass)

1. **AI billing entitlements** — `BillingSubscriptionPlanCode` adds `ai_verify_*` / `ai_learning_organisation` / `ai_enterprise`. Resolution via `entitlements-billing.ts` from active/trialing `BillingSubscription`. Checkout `POST /api/access-intelligence/billing/checkout` only when `STRIPE_AI_*_PRICE_ID` is configured (never invents prices).
2. **Prisma passports / visits / claims** — `ACCESS_INTELLIGENCE_USE_PRISMA=true` selects `PrismaAccessIntelligenceRepository` (passports, visit plans, verification requests, barrier reports, venue attestation claims). Place graphs still seed from demo until full twin import.
3. **First real adapters** — Messaging webhook (`ACCESS_INTELLIGENCE_MESSAGING_WEBHOOK_URL`) behind Trust Kernel approval + audit; BMS HTTP (`ACCESS_INTELLIGENCE_BMS_URL`) as live status + BuildingManagementAdapter (`mock: false` when URL set).

## Next three priorities

1. Durable consent grants in Prisma (replace in-memory Trust Kernel grants)  
2. Seed / import Living Twin graphs into `AiAccessPlace` (retire demo graph fallback for Harbour)  
3. Playwright acceptance for Visit / Verify / Learn / Pilot A–E  

Still mocked unless env URLs set: GTFS, indoor positioning, BIM import, venue messaging, BMS. Assessor field apps not connected.
