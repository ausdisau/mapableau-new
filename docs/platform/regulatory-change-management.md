# Regulatory change management

**Status:** Wave 8 Phase 32 — human-reviewed change tracker. Not authoritative interpretation.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, **approve regulatory interpretations**, expand rings, approve GA, or override cross-tenant controls.

## Models

- **`RegulatorySource`** — bibliographic reference (title, URL, effective date config key). Not a live NDIA feed.
- **`RegulatoryChangeCase`** — tracks impact assessment and remediation for a source change.

## Workflow

1. Human opens case linked to `RegulatorySource`.
2. Impact assessment (≥ 40 characters) documents affected controls and tenants.
3. Named human reviewer records decision.
4. Case closure updates policy profiles or entitlements as needed — separately approved.

`RegulatoryChangeCase` **cannot be closed by an AI actor**.

## Honest limits

- No claim of real-time regulatory sync with NDIA.
- Case records are internal readiness — not registration or legal advice.
- See [assurance disclaimers](../assurance/disclaimers.md).

## See also

- [Tenant policy profiles](./tenant-policy-profiles.md)
- [General availability readiness](./general-availability-readiness.md)
