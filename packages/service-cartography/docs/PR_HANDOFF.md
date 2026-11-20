# Suggested draft PR handoff

**Title:** `feat(cartography): add rights-first open-source service algorithms (synthetic preview)`

**Target:** `ausdisau/MapAble`, new feature branch, under
`apps/web/packages/service-cartography` after repository-boundary review.

## Summary

- Add an independent Apache-2.0 TypeScript domain package with matching,
  availability, service dependencies, accessible pathfinding, region gaps,
  scheduling, economic scenarios, equity analysis and political-label tests.
- Hard gates for scoped consent, participant exclusions, communication access,
  verified evidence and service availability.
- Human confirmation and advisory-only result markers; no transactions.
- Synthetic sample scenario, tests, impact/risk documentation and release gates.

## Evidence and operational status

- Local strict compilation and synthetic tests: passing at package authoring.
- No production integration/rollout, no external provider data, no DB migration.
- NDIS registration, funding eligibility, independent audit: not claimed.

## Pre-merge blockers

- Repository-specific lint/type/format/CI validation.
- Owner and data-protection review of adapter contracts.
- Lived-experience and accessibility review of future participant-facing UI.
- Maintainer determination of package location, naming, release license and
  trademark attribution.

## Release constraints

- Feature flag off by default.
- No live data or decision automation without separate gates.
- Do not touch existing Stripe, booking, worker registry or payment production paths.
