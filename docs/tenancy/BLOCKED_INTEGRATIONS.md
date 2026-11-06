# Coverage Care — blocked integrations

Everything below remains blocked for regulatory, credential, privacy, domain-ownership, or human-approval reasons. The pilot UI documents readiness only.

| Integration | Status | Blocker |
|---|---|---|
| Live DNS / TLS for `coveragecare.mapable.com.au` | Blocked | Domain ownership + DNS write requires human approval; no DNS changes in this PR |
| Production Prisma migration apply | Blocked | Explicit “no production migrations”; local migration file only |
| Live NDIA claim submission | Blocked | Official gateway disabled; credentials + regulatory go-live required |
| Verified NDIS registration claims in directory | Blocked | Synthetic listings only; unverified claims forbidden |
| Practitioner credential verification | Blocked | No credential verification provider wired for Coverage Care |
| Real bookings / calendar holds | Blocked | Pilot is enquiry-only; no booking capture |
| Payments / AbilityPay / Stripe | Blocked | Out of scope; no payment paths in Coverage Care module |
| BrandOS production publish / CDN assets | Blocked | Preview approvals only; production publish needs brand + security approval |
| Multi-host NextAuth / passkey RP ID | Blocked | Apex auth cookie model; security approval required before shared session on proposed host |
| Cross-tenant enterprise SSO packs | Blocked | Identity federation per tenant not provisioned |
| AAC device certification / switch-access lab attestation | Partial | UI follows WCAG 2.2 AA patterns + landmark tests; full AAC/switch lab remains human-run |

## What is intentionally available in the pilot

- Flag-gated Coverage Care shell and host rewrite code path
- Synthetic allied-health directory
- Participant enquiry → share review → submit → provider review → withdraw/delete
- Tenant isolation checks against fictional `acme-care`
- BrandOS + provisioning **preview** panels
- Disabled NDIA readiness panel
