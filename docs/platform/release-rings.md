# Release rings

**Status:** Wave 8 Phase 32 — staged deployment governance. Ring promotion ≠ tenant GA.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.** `ring_2_pilot` is a deployment ring, not Controlled Pilot authority.
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, **expand rings**, approve GA, or override cross-tenant controls.

## Ring progression

`ProductionRelease` advances:

`ring_0_internal` → `ring_1_canary` → `ring_2_pilot` → `ring_3_general_limited` → `ring_4_general`

| Ring | Required approvals |
|------|---------------------|
| ring_0_internal | engineering |
| ring_1_canary | engineering + safety |
| ring_2_pilot | engineering + safety + privacy |
| ring_3_general_limited | engineering + safety + privacy + security |
| ring_4_general | engineering + safety + privacy + security + executive |

`ring_4_general` further requires `executiveApprovedById` on the release. This authorises **code availability** — not any specific tenant's GA.

Test: `pnpm platform:test-release-rings`. UI: `/admin/platform/releases`, `/admin/platform/release-rings`.

## See also

- [Phase 32 release rings detail](./phase-32-release-rings.md)
- [General availability readiness](./general-availability-readiness.md)
- [Production SRE](./production-sre.md)
