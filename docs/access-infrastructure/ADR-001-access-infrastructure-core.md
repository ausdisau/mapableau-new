# ADR-001 — Access Infrastructure owned by MapAble Core

## Status

Accepted (documentation / foundation). Writers remain feature-flagged OFF by default.

## Decision

Functional **Access Infrastructure** is owned by shared MapAble Core — not by Care, Transport, or Jobs individually.

## Reasons

- Avoids duplicate accessibility profiles per vertical
- Enables cross-service coordination later without re-modelling requirements
- Supports consistent consent and attribute-level disclosure
- Keeps evidence provenance canonical
- Makes compatibility explainable and deterministic
- Prevents diagnosis-driven matching
- Supports future modules (Kids, Foods, Moves, Marketplace)

## Consequences

- Vertical modules depend on a shared contract (`lib/access/infrastructure`)
- Cross-module information requires explicit disclosure controls
- Compatibility is contextual rather than a universal score
- Legacy fields (`wheelchairAccessible`, `CareAccessNeed`, job `accessibilityFeatures`) remain until mapped and deprecated

## Non-decisions

- Not a microservices split
- Not legal Premises Standards / DSAPT certification
- Not NDIS registration status
