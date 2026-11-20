# Controlled integration into the canonical MapAble repository

**Inspected 18 November 2026 via read-only GitHub connector**:

- Canonical repository: `ausdisau/MapAble`.
- Web application: `apps/web`, Next.js, pnpm 10.12.1, Vitest.
- Mobile application: `apps/mobile`, separate Expo install root.
- `apps/web/pnpm-workspace.yaml` includes `packages/*`.
- Existing web packages include `@mapable/domain-transport`, `@mapable/domain-provider`
  and `@mapable/domain-workforce`.
- This deliverable has not been pushed to GitHub and does not modify production.

## Proposed location

Use `apps/web/packages/service-cartography` as a new package, not a new Next
route or a database migration. The package is also independently runnable.

The current package exports compiled ESM from `dist`. Build it before linking,
or for internal workspace development choose an explicitly reviewed source export
strategy consistent with the existing workspace packages. Do not silently change
its export configuration or copy compiled files into sensitive runtime routes.

## Suggested opt-in integration steps

1. Copy this package into `apps/web/packages/service-cartography` on a feature
   branch. Preserve its license and documentation.
2. Review the workspace dependency graph and pin `typescript` to a compatible
   version. Add `@mapable/service-cartography: workspace:*` to `apps/web` only
   after validating the actual pnpm lockfile and bundler behaviour.
3. Add a single server-side adapter that maps **synthetic** MapAble records to
   the exported domain types. Do not start by migrating tables or importing
   participant records.
4. Add a default-OFF flag, e.g. `MAPABLE_SERVICE_CARTOGRAPHY_PILOT=false`.
   Never expose privileged flag logic or secrets to browser clients.
5. Route to a read-only, authenticated **preview** that displays evidence status,
   alternatives, uncertainties and a human-approval path. No booking/payment code.
6. Add Vitest tests for tenant access, grant withdrawal, stale evidence,
   unverified provider, wrong communication needs, missing transport links,
   unknown supply and budget reduction invariance.
7. Test mobile/web contracts before sharing code across independent dependency
   roots. No React or Next imports belong in this domain package.
8. Complete `RELEASE_GATES.md`, run legal/privacy/security/accessibility reviews,
   and obtain a human release decision before enabling any real-data pilot.

## Suggested adapter contract

```ts
interface CartographyAdapter {
  loadVerifiedOffersForGoal(goalRef: string, callerContext: AuthenticatedContext): Promise<ServiceOffer[]>;
  loadPurposeBoundGrant(subjectRef: string, purpose: ConsentPurpose, callerContext: AuthenticatedContext): Promise<ConsentGrant[]>;
  recordAdvisoryOutcome(event: DecisionAuditEvent, callerContext: AuthenticatedContext): Promise<void>;
}
```

`AuthenticatedContext` must be defined in MapAble Core; do not trust client-
submitted tenant IDs or direct model outputs. Never let the client supply its
own credential-verification status. All source dates/IDs must be preserved.

## Narrow first vertical slice

A voluntary participant plans an accessible community visit with optional care
and transport. Input: consented synthetic goal, one provider availability record,
one vehicle resource slot, one verified accessible route segment. Output: two
advisory service choices, missing-dependency explanations and a request for
human confirmation. Test no-match and cancellation recovery before success.

## Avoid

- Live NDIS claims or price-limit advice without current official verification.
- Public presentation of a prototype as a production matching service.
- Autonomous worker assignment, claims, restrictive practices, incident decisions.
- Embedding keys in source files, Vercel env values in examples, or identity
  inference from untrusted client headers.
- Treating synthetic demo evidence as independently verified external evidence.
