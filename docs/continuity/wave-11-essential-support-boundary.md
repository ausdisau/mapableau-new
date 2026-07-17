# Wave 11 — Essential support boundary

"Essential support" is a status recorded on a participant's continuity requirement. Its ONLY acceptable sources are:

1. `participant_profile` — the participant themselves entered it.
2. `authorised_delegate_update` — a delegate with authority confirmed by the participant.
3. `coordinator_note_confirmed_with_participant` — coordinator recorded it AND has evidence of participant confirmation.

Sources that are NEVER acceptable and cause `assertEssentialSourceIsHumanDefined` to throw:

- `diagnosis`
- `plan_category`
- `ai_inference`

This guardrail exists to prevent policy or clinical categorisation from silently overriding the participant's own definition of what is essential.
