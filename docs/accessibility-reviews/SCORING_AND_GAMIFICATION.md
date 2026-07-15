# Scoring and gamification

## Dimension summary (community)

Per accessibility dimension / category:

1. Exclude drafts, removed, restricted (non-public), not_observed, not_applicable, unknown, duplicate-removed.
2. Apply Bayesian-adjusted mean against configurable prior (default prior mean 3.0 on a 1–5 scale, strength `C=3`).
3. Track independently: adjusted rating, raw response count, unique contributors, recent contributors, latest confirmation, evidence count, conflict count, confidence state.
4. Recency windows (single config source): recent ≤180d; aging 181–730d; stale >730d. Stale reviews remain in history with reduced weight.
5. Evidence increases confidence, not rating.
6. Venue responses never alter ratings.
7. Sponsorship / subscription never alters ratings, confidence, evidence order, or moderation.
8. Professional accreditation queried separately.
9. Return reason codes for UI copy (e.g. based on N recent contributions including confirmations).
10. Insufficient data → no misleading score; show “Limited information”.

### Confidence labels (independent of rating)

- Limited information
- Developing information
- Well supported
- Recently verified

## Points ledger

Append-only `AccessContributionLedger` with idempotency keys. Default awards (finalised after moderation where required):

| Contribution | Points |
| --- | --- |
| Complete accessibility review | 10 |
| Rate ≥3 observed dimensions | 5 |
| Approved relevant evidence | 5 |
| Approved objective measurement | 8 |
| Confirm older information still current | 8 |
| Update stale location information | 15 |
| Confirm previously reported barrier resolved | 12 |
| Accepted correction | 10 |
| Helpful reaction received | 1 |

Controls: no self-reactions; daily cap on reaction-derived points; reverse on removal; points never affect review weight, provider ranking, accreditation, or search placement.

## Badges (neutral, config-driven)

First accessibility review; Five locations reviewed; Evidence contributor; Information confirmer; Stale information updated; Barrier resolution confirmed; Accessible toilet contributor; Sensory information contributor; Transport access contributor; Regional contributor.

Users may hide totals and badges publicly. No public competitive leaderboard in MVP.
