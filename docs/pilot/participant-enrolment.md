# Participant enrolment

Flow: invite → information → explicit **pilot consent** → enrol → (suspend) → exit / withdraw.

## Rules

- Ordinary platform consent **does not** satisfy pilot consent.
- **No AI enrolment.**
- Empty participant caps (`maxActiveParticipants`) block over-enrolment.
- NDIS numbers are never returned from pilot APIs or UIs.
- Withdrawal is always available to the participant.

Services: `inviteParticipantToPilot`, `recordPilotConsent`, `enrolParticipantInPilot`, `exitPilotParticipant`, `withdrawPilotConsent`.
