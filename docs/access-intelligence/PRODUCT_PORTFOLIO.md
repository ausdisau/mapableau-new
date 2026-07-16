# Product portfolio

## Initial commercial products (implemented surfaces)

| Product | Route | Purpose |
|---------|-------|---------|
| Access Intelligence Core | `/access-intelligence` | Passports, visit planning, decisions, chat optional |
| MapAble Trust Kernel | policy layer | Consent, approvals, audit, field minimisation |
| MapAble Verify | `/verify` | Venue inventory, evidence, incidents, attestations, public guides |
| Access Intelligence Learning Lab | `/access-intelligence/learn` | Scenarios + Interview L3 flight-sim |
| Living Access Twin | `/access-intelligence/buildings/[placeId]` | Visit / Learn / Operate / Improve |
| Pilot and Evaluation Console | `/access-intelligence/pilots` | Synthetic cohorts, metrics, export |

## Entitlement plans

Community · Verify Starter · Verify Operations · Verify Portfolio · Learning Organisation · Enterprise  

See `lib/access-intelligence/entitlements.ts`. Paying does **not** increase a venue’s accessibility score.

## Future products (documented only — no empty shells)

| Product | Intended use | Interface today |
|---------|--------------|-----------------|
| MapAble Journey | Multi-leg person journeys | TransportDataAdapter mock |
| MapAble Work | Workplace accessibility | Documented domain extension |
| MapAble Cities | Civic portfolios | Verify Portfolio entitlement |
| MapAble Campus | Campus graphs | BuildingModelImporter mock |
| MapAble Tourism | Itinerary accessibility | Future destination packs |
| Developer Platform | Read-only decision API | DeveloperApiAdapter mock |
| Adaptive Building Integrations | Propose BMS changes | BuildingManagementAdapter mock (never silent execute) |
