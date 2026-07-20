# Architecture — Positive Behaviour Support boundaries

## Domain boundary

Canonical package: `lib/positive-behaviour-support/`. Clinical aggregates are `Pbs*`-prefixed Prisma models, tenant-scoped by `organisationId`, with assignment-based access.

## Reuse (do not fork)

- Identity: `User`, `ParticipantProfile`
- Tenancy: `Organisation`, `OrganisationMember`
- Consent: `ConsentRecord` / `lib/consent`
- Delegated authority: `ParticipantAuthorityGrant`
- Audit: `AuditEvent` / `lib/audit` (+ PBS metadata sanitiser)
- Sensitive access: `ParticipantAccessReceipt`, break-glass
- Sources: `ProgrammeSourceRecord`
- Documents: existing `Document` storage (`behaviour_support_plan` category)

## Access boundary

Does **not** use ambient `case:read:any` or `canViewParticipantProfile` for clinical PBS content. Access purposes:

1. Participant self
2. Valid scoped `ParticipantAuthorityGrant` (expired/revoked denied)
3. Assigned practitioner within organisation
4. Implementing provider (implementation fields only)
5. Admin governance metadata; clinical only with break-glass + receipt

## Lifecycle boundary

Only deterministic domain services transition plan status. Client-supplied status is ignored. Finalised versions are immutable.

## AI boundary

Default `PbsAssistanceEngine` is deterministic, local, `DRAFT_ONLY`. External models remain separately disabled. Models never write final/active plans; statements remain candidates until human acceptance.

## Restrictive practice boundary

Highest-risk gate. Possible/regulated RP creates high-priority practitioner review, suspends AI drafting for the section, requires manual classification and checklist items, and blocks activation on authorisation gaps. Submission is an external human process.
