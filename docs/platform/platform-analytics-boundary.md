# Platform analytics boundary

**Status:** Wave 8 Phase 32 — privacy-safe fleet analytics. No participant re-identification.

## Non-negotiable disclaimers

- **`Organisation.id` is the tenant security boundary.**
- **Platform admins do not automatically access participant data.** Fleet analytics use aggregates only.
- **Hub-and-spoke ≠ unrestricted sharing.**
- **Env ≠ entitlement ≠ assurance ≠ registration.**
- **Pilot ≠ GA.**
- **Policies are versioned;** historical records retain historical policy.
- **Unknown health ≠ healthy.**
- **Critical integrations fail closed.**
- **No AI may** activate tenants, approve regulatory interpretations, expand rings, approve GA, or override cross-tenant controls.

## Privacy rules

`lib/analytics/privacy`:

- Rejects rows containing NDIS numbers or complaint free text.
- Refuses export of raw participant identifiers to platform-wide dashboards.

`lib/analytics/aggregation`:

- Minimum cohort size **10** — smaller cohorts are suppressed, not rounded up.
- Cross-tenant benchmarks never expose single-tenant participant rows.

## Allowed platform metrics

- Fleet entitlement utilisation (counts, not identities)
- Release ring adoption rates
- Integration health aggregates
- Quota utilisation percentiles

## Forbidden

- Participant-level drill-down from platform console without break-glass.
- Selling or sharing aggregate data outside contract scope.

## See also

- [Tenant observability](./tenant-observability.md)
- [Market integrity](./market-integrity.md)
- [Privacy and consent](../assurance/privacy-and-consent.md)
