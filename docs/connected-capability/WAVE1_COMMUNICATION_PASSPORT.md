# Wave 1 — Communication Passport Projection

**Public name:** Communication Passport (MapAble Communication)  
**Internal:** CommunicationsOS

## Scope

- Versioned communication requirement vocabulary
- Participant-authored instruction contract
- Read-only projection from `AccessibilityProfile`
- Meaning-preservation rendering request/response
- Printable Communication Handoff Card
- Synthetic Taylor fixture
- AURA presentation adapter interface (no execution authority)
- Audit event names
- Feature flags default off
- Accessible participant preview at `/dashboard/communication-passport`

## Non-goals

- External messages / SMS / email send
- Interpreter booking
- Automated consent
- Supporter authority by relationship
- Prisma migration
- Competing participant profile
- Diagnosis-inferred communication needs

## Flags

```
MAPABLE_COMMUNICATIONS_ENABLED=false
MAPABLE_COMMUNICATION_PASSPORT_ENABLED=false
MAPABLE_COMMUNICATION_RENDERING_ENABLED=false
MAPABLE_COMMUNICATION_HANDOFFS_ENABLED=false
```

## APIs

- `GET /api/communications/passport` — projection + handoff card (`?fixture=taylor` for synthetic)
- `POST /api/communications/render` — rendering contract

## Rollback

Set flags to `false` and revert the PR. No migration to reverse.

## Acceptance walkthrough

1. Enable communications + passport flags in a non-production env.
2. Open `/dashboard/communication-passport` with Taylor fixture.
3. Confirm instructions, one-question and response-time requirements.
4. Confirm capacity/consent notes present.
5. `POST /api/communications/render` with `{ "fixture": "taylor", "presentation": "easy_read" }`.
6. Confirm no outbound messaging occurred.
