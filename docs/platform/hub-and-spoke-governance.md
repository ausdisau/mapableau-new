# Hub-and-spoke governance

**Status:** Wave 8 Phase 32 — federation and delegation design. Not unrestricted data sharing.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.**
- **Hub-and-spoke ≠ unrestricted sharing.** Parent links, `TenantFederation`, and `FederationMembership` are governance grouping — not data access grants.
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Models

| Model | Purpose |
|-------|---------|
| `parentOrganisationId` | Declares hub/spoke hierarchy for reporting |
| `TenantFederation` | Named federation (e.g. provider group) |
| `FederationMembership` | Org membership in a federation |
| `DelegatedTenantAuthority` | Narrow, time-bound, human-approved rights |

## Delegation rules

`DelegatedTenantAuthority` grants **only** the enumerated rights (e.g. read aggregate metrics, approve onboarding case). It does **not**:

- Grant participant record access by default
- Bypass break-glass for sensitive reads
- Propagate to child orgs automatically
- Expire silently — expired delegation denies

## Hub operator UX

`/admin/platform/federations` shows federation topology. Spoke detail pages display delegation status and expiry. Amber banners state that hub visibility ≠ participant data access.

## See also

- [Tenant model](./tenant-model.md)
- [Tenant context](./tenant-context.md)
- [Tenant onboarding](./tenant-onboarding.md)
