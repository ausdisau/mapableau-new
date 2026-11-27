# ASI disability-care constraints for MapAble

**Status:** Binding product constraints (docs-only).  
**Date:** 2026-11-28 (Australia/Sydney)  
**Source paper:** *Artificial Superintelligence in Australian Disability Care and Community Services* (31 October 2026)  
**Related:** [`docs/ai-platform/GOVERNED_ACTION_KERNEL.md`](../ai-platform/GOVERNED_ACTION_KERNEL.md), [`docs/ai-platform/acs/`](../ai-platform/acs/), Support Intelligence hard-deny flags

This file maps the paper’s near-term governance findings to MapAble engineering rules. “ASI readiness” here means **governing today’s narrow systems** (will and preferences, human override, transparency, fail-closed flags) — not deploying superintelligence.

## Non-negotiable product rules

| ASI / CRPD principle | MapAble product rule | Where enforced |
| --- | --- | --- |
| Will and preferences over “best interests” | Participant-confirmed meaning/intent before any handoff, assignment proposal, or outbound message that carries their words | One Journey meaning confirm; consent gates; no substituted decision by ranking models |
| Genuine human override | No silent auto-roster publish, auto-invoice authorise, auto-charge, auto-eligibility, or autonomous dispatch | Deputy `blnPublish=false` by default; Xero `DRAFT` only; Stripe Checkout only after review; Support Intel `hardDenyOperationalActions()` |
| Transparency / contestability | Evidence rows use explicit states (`confirmed`, `declared`, `unknown`, `conflict`, `stale`, `withdrawn`); never invent registration or clearance claims | Support Intelligence honesty layer; provider finder copy; algorithm register |
| No shadow AI on sensitive notes | No unsolicited model calls or third-party LLM drafting of clinical/progress notes, support plans, or participant free text in these increments | One Journey and booking→finance PRs forbid model calls; provider AI use remains organisationally governed |
| Fail-closed / disability-led | Feature flags default **off**; production denial until owner gates; disabled people’ words and consent are not overridden by convenience | `MAPABLE_*` / `MAPABLE_SUPPORT_INTEL_*` / integration flags; Starting Work pilot gates |
| No Robodebt-class ADM | MapAble must not automate NDIS eligibility, funding tier, plan renewal, or penalty decisions; human review remains mandatory for high-impact exceptions | Domain ownership; human-review queues; no AI authority over eligibility/funding |

## Sequencing obligations

Feature PRs in the ASI → One Journey → Integrations sequence **must cite this file** in the PR description and must not violate the table above.

1. **One Journey** (`/pilot/starting-work/interview`): synthetic pilot only; confirmed meaning; selective handoff; no booking/payment/dispatch/model calls.
2. **Integrations:** Stripe fail-closed webhooks first; Deputy unpublished drafts; Xero draft ACCREC; Care sandbox slice only after those land.
3. **Production enablement:** separate owner-gated PR after privacy, finance, and accessibility sign-off. Never flip live charges, published rosters, or authorised invoices in scaffold PRs.

## Consent and source of truth

- Consent remains owned by existing `ConsentRecord` / consent libs — **do not** invent a second consent SoT.
- Bookings, invoices, and care assignments remain MapAble/PostgreSQL SoT; Deputy, Xero, and Stripe hold external operational copies with mappings and reconciliation only.

## Explicit non-goals of this document

- Does not authorise Stage 1+ ACS runtime merges by itself.
- Does not enable Support Intelligence, Deputy, Xero, or Stripe production flags.
- Does not claim ASI capability exists or that MapAble is “ASI-ready” as a marketing claim.
