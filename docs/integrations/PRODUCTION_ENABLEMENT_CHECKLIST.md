# Production enablement checklist (later — owner-gated)

**This document does not enable anything.** Separate explicit PRs are required to flip each flag after sign-off. Default posture remains fail-closed.

## Prerequisites (merge order)

1. Support Intelligence #752 — flags remain **off**
2. CI debt / advisory allowlist remediation (#753 or successor)
3. ASI constraints doc (`docs/governance/asi-disability-care-constraints.md`)
4. One Journey pilot (synthetic only)
5. Stripe webhook fail-closed + outbox scaffold
6. Deputy draft unpublished adapter
7. Xero draft ACCREC adapter
8. Care finance sandbox slice verified in preview/sandbox

## Owner gates before any production flag flip

| Gate | Owner | Evidence required |
| --- | --- | --- |
| Privacy / data residency | Privacy lead | Vendor DPA review; minimum fields only |
| Finance / merchant of record | Finance lead | Stripe Connect liability model; fee economics |
| Safeguarding / human override | Care ops | Roster publish and invoice authorise remain human |
| Accessibility | A11y lead | WCAG 2.2 AA on participant billing/status views |
| Security | Security | Webhook signing, livemode reject, secret rotation |
| Legal / NDIS | Legal | Funding-branch honesty; no automated eligibility |

## Flags that must stay false until dedicated enablement PRs

```dotenv
MAPABLE_SUPPORT_INTEL_ENABLED=false
MAPABLE_SUPPORT_INTEL_KILL_SWITCH= # leave unset unless emergency stop
MAPABLE_STARTING_WORK_PILOT_ENABLED=false   # production interview route 404s
MAPABLE_INTEGRATIONS_OUTBOX_ENABLED=false
MAPABLE_INTEGRATIONS_DRY_RUN=true
DEPUTY_ENABLED=false
XERO_DIRECT_ENABLED=false
STRIPE_DIRECT_BOOKING_ENABLED=false
```

## Explicitly forbidden in enablement PRs

- Auto-publish Deputy rosters
- Auto-authorise/send Xero invoices
- Treating Checkout return URLs as payment proof
- NDIS agency claim automation
- AI authority over consent, eligibility, funding, or worker suitability
- Enabling Support Intelligence spider crawl in production without registration gates

## Controlled pilot vs production

| Mode | Allowed | Not allowed |
| --- | --- | --- |
| Controlled pilot | Synthetic fixtures, dry-run outbox, sandbox Stripe/Xero Demo Company | Live charges, published rosters, authorised invoices |
| Production | Only after this checklist + dedicated PR per flag | Bulk flag flips; “enable everything” PRs |

## Next safe action

Do **not** open an enablement PR until the Care finance sandbox slice has passing sandbox evidence attached and the owners above have signed in writing (ticket or PR approval with role named).
