# Fuel Intelligence / FuelCheck Mate — Design

**Date:** 2026-09-15  
**Status:** Approved architecture, implementation pending written-spec review  
**Repository:** `ausdisau/mapableau-new`  
**Branch:** `feat/fuel-intelligence-foundation`

## Decision

Implement FuelCheck Mate as a deterministic `fuel-intelligence` subsystem inside the existing MapAble repository. State-specific fuel-source adapters normalise external data into a typed internal contract; deterministic code owns freshness filtering, arithmetic, sorting, savings and trend classification; an LLM may present or explain the resulting structured summary but must not determine regulatory or mathematical truth.

## Scope

The first implementation slice will:

- add Zod input/output contracts for normalised fuel observations and market summaries;
- support NSW FuelCheck and WA FuelWatch through separate adapter interfaces and provider-specific normalisation;
- parse Australian source timestamps into UTC instants using adapter-owned time-zone rules;
- exclude observations only when age is strictly greater than 24 hours;
- reject malformed timestamps rather than treating them as fresh;
- normalise source price values into integer tenths-of-a-cent per litre;
- sort active stations cheapest to most expensive with deterministic tie-breaking;
- calculate the arithmetic mean from active, non-stale observations only;
- calculate cheapest-station savings from the exact internal arithmetic baseline;
- convert cents-per-litre to displayed dollars-per-litre using arithmetic rounding rather than truncation;
- emit a fixed `INSUFFICIENT_HISTORY` trend state for snapshot-only input;
- derive rising/falling/stable/mixed trend states only from explicit historical daily-average observations;
- preserve stale and rejected observations in audit metadata without including them in market calculations;
- provide a presentation DTO suitable for FuelCheck Mate or other MapAble UI surfaces;
- add Vitest coverage for arithmetic, freshness, timestamp, empty-data and trend edge cases.

The first slice will **not**:

- persist fuel observations to Prisma;
- add a new source-of-truth table;
- couple fuel calculations to Care, Transport or billing writers;
- let an LLM perform arithmetic, timestamp validation or stale-data decisions;
- claim a live FuelCheck/FuelWatch integration until current official endpoints, credentials, rate limits and production behaviour have been verified;
- modify production deployment or environment variables.

## Repository boundaries

This subsystem must extend the current repository rather than create a parallel `/src` application. It will live under focused library and test paths, following existing root-level `lib/` and `tests/` conventions.

Proposed paths:

```text
lib/fuel-intelligence/
  contracts.ts
  price.ts
  time.ts
  market-summary.ts
  trend.ts
  adapters/
    types.ts
    nsw-fuelcheck.ts
    wa-fuelwatch.ts
  presentation.ts
  index.ts

tests/fuel-intelligence/
  price.test.ts
  freshness.test.ts
  market-summary.test.ts
  trend.test.ts
  adapters.test.ts
```

No Prisma migration is required for this foundation slice.

## Core contracts

### Normalised observation

A normalised station observation contains:

- `stationId`
- `stationName`
- `address`
- `suburb`
- `state`
- `fuelType`
- `priceTenthsCentsPerLitre` — integer source-of-truth amount
- `observedAt` — ISO UTC timestamp
- `retrievedAt` — ISO UTC timestamp
- `source` — `NSW_FUELCHECK` or `WA_FUELWATCH`
- optional source record/reference metadata

Raw external payloads must never be trusted as already normalised.

### Market summary

`FuelMarketSummary` contains:

- `status`: `OK | NO_DATA | NO_ACTIVE_STATIONS | INVALID_INPUT`
- `calculatedAt`
- ordered `activeStations`
- `staleStations`
- `rejectedObservations`
- `cheapestStation` when available
- exact internal arithmetic-mean numerator/denominator information
- display-ready rounded mean
- exact internal savings numerator/denominator information
- display-ready savings
- `trend`
- source/count metadata

This preserves the ability to audit display rounding without using floating-point display values as calculation inputs.

## Price arithmetic

External prices may arrive as strings or JSON numbers representing cents per litre, commonly with one decimal place such as `189.9`.

The normaliser converts each valid value to integer tenths-of-a-cent:

```text
189.9 c/L -> 1899 tenths-of-cent/L
```

All ranking, sums and comparisons use integers.

Dollar display conversion rounds to the nearest whole cent using integer arithmetic:

```text
1899 tenths-of-cent/L -> 190 cents/L -> $1.90/L
```

It must never truncate `189.9 c/L` to `$1.89/L`.

The arithmetic mean is computed from the integer sum of active prices divided by the active-station count. Because the mean can be fractional beyond source resolution, the engine keeps the exact numerator and denominator internally. Presentation values are rounded explicitly and never fed back into calculations.

Savings is the exact arithmetic difference between the active-station mean and the cheapest observation, represented internally as a rational value and rendered to a documented display precision.

## Freshness and time-zone rules

Freshness is evaluated against an injected `now` instant to keep behaviour deterministic and testable.

A station is stale iff:

```text
now - observedAt > 24 hours
```

Exactly 24 hours old remains active.

Provider adapters own the interpretation of provider-local wall-clock strings. NSW timestamps use `Australia/Sydney`; WA timestamps use `Australia/Perth`. The parser must round-trip parsed local components through the nominated IANA time zone and reject malformed or impossible timestamps rather than guessing.

A clearly future-dated observation is rejected as invalid rather than producing a negative age.

## Trend safeguard

Snapshot-only processing must return:

```text
INSUFFICIENT_HISTORY
```

with presentation text equivalent to:

> Insufficient comparative historical observations available to establish active market trend trajectories.

Trend analysis requires explicit historical daily-average observations. The first version uses the current active mean plus at least two prior daily averages. It classifies:

- `RISING` when the three-point sequence is non-decreasing and at least one step increases;
- `FALLING` when the sequence is non-increasing and at least one step decreases;
- `STABLE` when all compared values are equal;
- `MIXED` otherwise;
- `INSUFFICIENT_HISTORY` when evidence is insufficient.

The LLM must not override this result.

## Adapter model

All provider-specific code implements a shared adapter contract:

```text
FuelSourceAdapter
  source
  state
  timeZone
  parse(payload, retrievedAt) -> AdapterResult
```

`AdapterResult` separates:

- normalised observations;
- rejected records with machine-readable reasons;
- source metadata.

The NSW and WA adapters may accept different raw payload schemas but must emit the same normalised contract.

Live HTTP clients are deliberately outside the first pure-domain slice. When added, they must be thin fetch/auth/rate-limit layers feeding the adapters, not alternate calculation engines.

## Prompt-injection and text safety

Station names, addresses and provider-supplied strings are untrusted data. They remain data fields and must never be interpolated into system/developer instructions as executable instructions.

The LLM presentation layer receives a validated `FuelMarketSummary`, not raw third-party JSON where practical. If raw text is ever shown to a model, it is clearly delimited as untrusted source data.

Zod validates data shape and constraints but is not treated as an HTML/XSS sanitizer. UI rendering must continue to rely on React escaping, and any future rich HTML field must use an explicit sanitizer.

## Presentation boundary

FuelCheck Mate is a presenter, not the calculator. Its input is a validated market summary. A successful response can render:

```text
Best Market Value
price
savings against active-station arithmetic mean
address
freshness
ordered competitor grid
active-station mean
engine-derived trend statement
stale omissions
```

If `status` is `NO_DATA` or `NO_ACTIVE_STATIONS`, the presenter must not invent a price and should request a broader radius/suburb or report that all supplied records were stale.

## Accessibility

Any future UI surface must:

- expose price, freshness and trend as text, not colour alone;
- preserve logical heading structure;
- support keyboard and screen-reader navigation;
- meet WCAG 2.2 AA contrast and focus requirements;
- use accessible status announcements for refreshed results where appropriate;
- avoid auto-refresh patterns that steal focus or make the interface difficult for AAC, switch or eye-gaze users.

## Failure handling

The deterministic engine distinguishes:

- empty provider result;
- all records stale;
- malformed record(s) with some valid records remaining;
- fully invalid payload;
- unsupported source/fuel type;
- invalid/future timestamp;
- invalid price.

Partial validity is permitted when the source payload contains independently parseable station records. Rejected records are surfaced in audit metadata; they do not contaminate valid calculations.

## Tests

The initial Vitest suite must prove at minimum:

1. `189.9 c/L` displays as `$1.90/L`.
2. half-cent/dollar-boundary values use arithmetic rounding and never truncation.
3. exactly 24 hours old remains active.
4. `24h + 1s` is stale.
5. mixed fresh/stale inputs calculate from fresh observations only.
6. all-stale input yields `NO_ACTIVE_STATIONS` with no cheapest or mean.
7. empty input yields `NO_DATA`.
8. mean and savings use exact internal integer/rational arithmetic.
9. sorting is deterministic when prices tie.
10. malformed timestamps are rejected.
11. future timestamps are rejected.
12. snapshot-only input returns `INSUFFICIENT_HISTORY`.
13. explicit historical observations can produce `RISING`, `FALLING`, `STABLE` and `MIXED`.
14. NSW timestamps respect `Australia/Sydney`, including daylight-saving behaviour.
15. WA timestamps respect `Australia/Perth`.
16. provider strings resembling instructions remain inert data.
17. adapter failures are distinguishable from legitimate empty results.

## Acceptance criteria

The foundation is complete when:

- all new fuel-intelligence tests pass;
- repository type-check passes for changed contracts;
- lint passes for changed files;
- no Prisma migration is introduced;
- no production secrets or API credentials are committed;
- the engine can produce the same summary for the same payload and injected `now` regardless of LLM availability;
- presentation code cannot change calculated values;
- raw stale records are excluded from active calculations and reported separately;
- source and freshness metadata remain auditable.

## Rollout

1. Implement pure contracts, price arithmetic, freshness and trend logic using TDD.
2. Implement provider adapters against captured fixture payloads.
3. Add a presentation DTO/formatter with no calculation authority.
4. Verify type-check/lint/Vitest.
5. Only after current official API verification, add network clients and credentials in a separate reviewed change.
6. Connect the resulting service to MapAble Transport/Care margin analysis only through a later explicit integration contract so fuel intelligence does not become a hidden dependency of booking or billing logic.

## Open questions deliberately deferred

- exact official production endpoint/authentication details for NSW FuelCheck and WA FuelWatch;
- caching cadence and rate-limit policy;
- persistence/retention of historical price observations;
- route-aware cheapest-stop optimisation with Valhalla;
- Care/Transport cost-engine integration;
- public UI placement and refresh cadence.

These require current source/API verification and separate review rather than assumptions in the foundation layer.
