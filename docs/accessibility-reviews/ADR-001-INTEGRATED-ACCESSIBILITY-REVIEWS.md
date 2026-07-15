# ADR-001: Integrated accessibility reviews

## Status

Accepted

## Context

MapAble already ships Access places on the map, community reviews with category ratings, professional accreditation, venue claims, moderation, notifications, and audit. The product requirement is a richer accessibility-review layer (dimensions, confidence, comments, temporary alerts, contribution points and badges) that must remain a native extension of Access — not a new brand or microsite.

## Decision

1. Extend the existing Access domain (`AccessPlace`, `AccessPlaceReview`, accreditation, moderation) rather than creating parallel product infrastructure.
2. Keep community information and professional accreditation visually and computationally separate.
3. Compute dimension-level Bayesian-adjusted community summaries; never replace them with a single universal legal compliance score.
4. Gate unfinished surfaces with `ACCESSIBILITY_REVIEWS_V1_ENABLED` / `accessibility_reviews_v1`.
5. Award contribution points via an append-only ledger that cannot affect ratings, accreditation, search ranking, or moderation authority.
6. Reuse audit, notifications, support tickets, and design-system patterns.

## Consequences

- Existing review rows remain valid; new fields are additive and nullable where needed.
- Venue representatives may respond and propose resolutions but cannot delete or suppress community reviews.
- Serious safety reports enter protected workflows; public UIs show only neutral “Under review” states.
- Rollback: set `ACCESSIBILITY_REVIEWS_V1_ENABLED=false` to hide new UI; additive schema may remain; ledger awards stop when flag-gated service paths are disabled.

## Privacy boundary

- Optional access context (mobility aid type, sensory needs, etc.) is never required and never published by default.
- Diagnosis is never requested.
- Reporter identity is never exposed to venue representatives.
- Analytics events must not include private access-context fields or review body PII.

## Scoring rationale

Naive averages overstate certainty with few reviews. Bayesian adjustment toward a neutral prior, plus independent confidence labels (limited / developing / well supported / recently verified), keeps the UI honest when evidence is thin.
