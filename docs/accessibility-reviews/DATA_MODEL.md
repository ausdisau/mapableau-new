# Accessibility reviews — data model

Naming follows existing Access Prisma conventions (`Access*`, snake_case `@@map`).

## Extended `AccessPlaceReview`

| Field | Notes |
| --- | --- |
| `overallExperience` | enum: completely…prefer_not |
| `observationSource` | in_person / venue_inspection / other |
| `visitTimePrecision` | none / approximate / exact (exact time not published unless opted in) |
| `temporaryIssue` | boolean |
| `publishedAt`, `deletedAt` | soft lifecycle |
| `accessContextJson` | private optional functional context; never in public serializers |

## Ratings

`AccessPlaceReviewRating` continues to use `AccessRatingCategory`. UI groups categories into 12 display dimensions.

`AccessRatingValue` gains: `very_difficult`, `difficult`, `mixed`, `very_good`, `not_observed` while retaining legacy values. Scoring excludes `unknown`, `not_observed`, `not_applicable`.

## New models

| Model | Purpose |
| --- | --- |
| `AccessReviewFeatureTag` | Stable tag keys + positive/barrier sentiment |
| `AccessPlaceComment` | Threaded comments; feature anchors; comment types |
| `AccessEvidenceLink` | Evidence metadata linking reviews/comments to media |
| `AccessReaction` | helpful / confirm / changed; unique per user+target+type |
| `AccessPlaceAlert` | Temporary barriers with expected expiry |
| `AccessIssueHistory` | Append-only issue state machine |
| `AccessContributionLedger` | Auditable points; unique `idempotencyKey` |
| `AccessBadgeDefinition` / `AccessUserBadge` | Config-driven badges |
| `AccessContributionPrivacy` | Hide points/badges from public profile |
| `AccessMappingChallenge` / progress | Optional mapping challenges |
| `AccessDimensionSummary` | Per-dimension Bayesian summary cache |

## Constraints

- `AccessContributionLedger.idempotencyKey` `@unique`
- One active reaction per `(userId, targetType, targetId, reactionType)`
- Feature tag uniqueness `(reviewId, tagKey)`
- Indexes on `(placeId, status)`, ledger `(userId, awardedAt)`, comments `(placeId, createdAt)`

## Public serialization rules

Never expose: `accessContextJson`, moderation notes, internal reporter IDs to venues, raw health/diagnosis fields.
