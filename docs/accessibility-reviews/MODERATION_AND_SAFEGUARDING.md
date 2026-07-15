# Moderation and safeguarding — accessibility reviews

## Reused infrastructure

- `AccessModerationQueue` / `AccessModerationDecision`
- `AccessContentReport` / review reports
- `SupportTicket` and safety workflows
- `AuditEvent` + Access domain event tables
- Content safety rules in `lib/access-moderation/content-safety-rules.ts`

## Report reasons

Public community reasons include:

- incorrect information
- outdated information
- privacy concern / personal information
- abusive or discriminatory content
- suspected fake contribution
- conflict of interest
- unsafe advice
- inappropriate media
- serious safety concern

Serious categories (violence, abuse, neglect, exploitation, sexual misconduct, immediate danger, sensitive personal information) must:

1. Not become ordinary public discussion threads.
2. Escalate into protected support / incident workflows.
3. Show only a neutral public state such as “Under review”.

## Venue representatives

May: respond publicly as venue; mark investigating; propose resolution; upload improvement evidence; request factual correction.

May not: delete, hide, or edit another person’s community review; award points; alter accreditation; alter aggregate calculations.

## Appeals

Appeals append new moderation decisions; prior history is never rewritten. Points tied to removed content are reversed via ledger reverse entries (never hard-delete of award history without reverse).

## Privacy

- Strip unnecessary image metadata where the media path supports it.
- Sanitize rich text.
- Do not expose reporter identity to venue users.
- Do not publish diagnosis or private travel history.
