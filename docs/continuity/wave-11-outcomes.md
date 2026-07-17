# Wave 11 — Continuity outcomes

`ContinuityOutcome.signal`:

- `goal_preserved` — the outcome preserved the participant's goal.
- `goal_partially_preserved` — partial preservation.
- `goal_missed` — the goal was not met.
- `participant_declined_all_options` — the participant chose "do nothing"; this is a valid outcome.
- `no_safe_option_available` — the builder produced `no_safe_option`.
- `human_escalated` — case escalated to a human.
- `unknown` — outcome unrecorded (must eventually be resolved).

Outcomes measure GOALS, not bookings. A shift that "successfully cancelled" without preserving a goal is `goal_missed`.
