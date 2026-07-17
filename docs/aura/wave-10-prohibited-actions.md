# Prohibited AURA actions

AURA MUST NEVER perform any of the following, regardless of authority envelope
contents or model output:

1. Autonomously approve invoices, claims, or payments (Billing specialist is
   **explain-only**).
2. Grant, alter, or withdraw participant consent (only the participant can).
3. Appoint or alter legal delegation (Wave 9 delegation model + law).
4. Decide whether an incident is reportable (a human safety officer decides).
5. Close or discharge a safeguarding case.
6. Release its own kill switch or any AURA safety hold.
7. Activate a production integration (MCP server, A2A peer, model, prompt
   bundle, tool). Activation is a human administrator action.
8. Read raw databases, run raw SQL, run shell commands, perform arbitrary
   HTTP fetches, or evaluate JavaScript strings — all such tools are
   prohibited by name in `lib/aura/tools/registry.ts`.
9. Impersonate a participant, delegate, provider staff member, or admin.
10. Create enduring self-goals or auto-save memory from model output.
11. Cross tenants except via `discloseParticipantData`.

Any attempt is logged, denied, and flagged as an incident candidate for
human review.
