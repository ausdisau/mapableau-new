# Tenant policy profiles

**Status:** Wave 8 Phase 32 — versioned per-tenant policy binding.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain the policy version in force at write time.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## TenantPolicyProfile

Binds an organisation to a named policy bundle:

| Domain | Examples |
|--------|----------|
| Privacy | Retention, consent defaults, export rules |
| Safety | Incident escalation, banning-order handling |
| Pilot | Controlled pilot caps (if applicable) |
| Integration | Allowed integration profiles |

Each profile has a **version** (`profileVersion`). Updates create a new version; they do not retroactively rewrite historical records.

## Historical policy retention

Records written under version *N* store `policyProfileVersion` (or equivalent metadata). Compliance queries use the version at write time, not the current profile.

API: `GET /api/provider/policies`. UI: `/provider/admin/policies`.

## See also

- [Regulatory change management](./regulatory-change-management.md)
- [Feature entitlements](./feature-entitlements.md)
- [Continuous assurance](./continuous-assurance.md)
