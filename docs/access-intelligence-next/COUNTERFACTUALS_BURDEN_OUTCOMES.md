# Access Intelligence Next — Counterfactuals, Burden, Outcomes

Wave 10–11 synthetic/shadow contracts.

## Counterfactuals

- Path: `lib/access-intelligence-next/counterfactuals/`
- API: `GET|POST /api/access-intelligence-next/counterfactuals`
- Flag: `MAPABLE_ACCESS_COUNTERFACTUALS_ENABLED`

Simulates failures (lift, entrance, inaccessible replacement, …) with valid/invalid
alternatives. **`externalActionsExecuted` is always false.**

## Burden

- Path: `lib/access-intelligence-next/burden/`
- API: `POST /api/access-intelligence-next/burden`
- Flag: `MAPABLE_ACCESS_BURDEN_ENGINE_ENABLED`

Attributes confirmations, calls, forms, and detours to organisations/workflows.
**`notAParticipantScore: true`** — never a complexity or independence score.

## Outcomes

- Path: `lib/access-intelligence-next/outcomes/`
- API: `POST /api/access-intelligence-next/outcomes`
- Uses proof-carrying master enablement

Distinguishes route found ≠ request created ≠ service confirmed ≠ participant goal achieved.
Default synthetic state: `participant_goal_not_yet_verified`.

## Non-goals

- ContinuityOS case writes
- Bookings or dispatch
- Prisma persistence
- Public production claims
