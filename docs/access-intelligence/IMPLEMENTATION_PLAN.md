# Access Intelligence — Implementation Plan (commercial slice)

## Detected architecture (2026-07-16)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router, React 18 |
| Package manager | pnpm |
| AI SDK | `ai@^6.0.196` — `ToolLoopAgent`, approvals, structured output |
| Auth | NextAuth + `AiVenueStaffAssignment` / platform admin |
| ORM | Prisma 6; AI demo repo default + Living Prisma opt-in |
| Billing | Existing `BillingSubscription` (provider/employer) — **AI plans are application entitlements** until Stripe AI price codes exist |
| Tests | Vitest + Testing Library |

## Domain boundaries

- **Core domain:** ontology, passport, twin, evidence, fit/route/confidence/temporal  
- **Trust Kernel:** consent, approvals, audit (`rights/`, `audit.ts`)  
- **Verify:** venue inventory SaaS surface `/verify`  
- **Learning Lab:** existing learn + Interview L3  
- **Pilot console:** synthetic evaluation `/access-intelligence/pilots`  
- **Adapters:** typed mocks under `adapters/` (Priority 2 interfaces only)

## Delivery order completed in this pass

### Priority 0 (already present, reused)
Passport, twin, engines, evidence, consent, audit, Living Building Visit/Learn/Operate/Improve.

### Priority 1 (this pass)
1. Typed entitlements (`entitlements.ts`) — Community → Enterprise  
2. MapAble Verify pages + APIs (inventory, attestations, public guide, improvements)  
3. Pilot & Evaluation Console + de-identified export  
4. Adapter interface pack with labelled mocks  
5. Product portfolio / Verify / Pilot / Trust / Adapter / Ontology docs  

### Priority 2–3
Adapter **interfaces + mocks** only. Future Journey/Work/Cities/Campus/Tourism documented in PRODUCT_PORTFOLIO — no empty app shells.

## Feature flags / env

| Variable | Purpose |
|----------|---------|
| `ACCESS_INTELLIGENCE_DEMO_MODE` | Demo defaults (enterprise entitlement for walkthrough) |
| `ACCESS_INTELLIGENCE_PLAN` | Override entitlement plan |
| `ACCESS_INTELLIGENCE_USE_PRISMA` | Living persistence |
| `ACCESS_INTELLIGENCE_BMS_URL` | Live HTTP BMS |
| `ACCESS_INTELLIGENCE_ALLOW_DEMO_ROLE_PREVIEW` | Honour `x-access-role` in demo |

## Risks

- Entitlements not yet mapped to Stripe `BillingSubscriptionPlanCode`  
- Verify inventory for non-Harbour venues uses AccessGraph without full Living Twin coverage  
- Pilot metrics are synthetic by design  

## Test strategy

Unit tests for entitlements (including billing plan-code mapping), verify inventory listing, pilot export de-identification, adapters mock flag, Trust Kernel messaging approval, Prisma repository factory.
