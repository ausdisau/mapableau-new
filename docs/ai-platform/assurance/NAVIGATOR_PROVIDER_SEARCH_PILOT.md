# Navigator Provider-Search Pilot — Assurance Record

**Capability:** `navigator.provider_search_pilot`  
**Flag:** `MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT` (default **false**)  
**Freeze posture:** Extends Autonomy Assurance under **W-AA-1**; does not create a second AI OS.  
**ARC sidecar:** `lib/ai/platform/capabilities/arc/navigator.provider_search_pilot.arc.json`

## Scope

Interpret provider-search requests, gather preferences, apply deterministic hard constraints, return an explainable editable shortlist, create a `CareRequest` **draft** envelope, transfer filters to Provider Finder, escalate to a human when unsafe/unsupported/uncertain.

## Permanent prohibitions (executable in tests)

AI / pilot must not autonomously: book/cancel services; approve/pay; mutate participant records beyond draft+escalation; determine NDIS eligibility/funding; make clinical recommendations; authorise restrictive practices; suspend actors; allege fraud/abuse/misconduct; submit incident/regulatory reports; infer capacity.

## Dignity of risk

Mitigations must prefer the least-restrictive alternative that preserves participant-defined exclusions. Never score participant dangerousness or capacity.

## Privacy / accessibility impact (summary)

- Purpose-scoped consent receipts required before protected reads/tools.
- Decision Passport discloses AI involvement, missing data, and non-AI path.
- Streaming UI (when enabled) must meet WCAG 2.2 AA; lived-experience testing still required before any enablement.

## Rollback

1. `MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT=false`
2. Engage capability kill switch `navigator.provider_search_pilot`
3. Optional: `MAPABLE_AI_GLOBAL_KILL_SWITCH=true`
4. Revert additive migration on non-prod if required

## Pilot-release checklist

- [ ] Flags remain default false in production
- [ ] Security suites for consent/delegation/IDOR/replay/kill-switch green
- [ ] Accessibility journey evidence recorded (not disability simulation alone)
- [ ] Co-design gate cleared for participant-facing enablement
- [ ] Public claims remain `not_claimable`
