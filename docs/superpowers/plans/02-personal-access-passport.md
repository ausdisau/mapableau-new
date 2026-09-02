# Prompt 02 — Personal Access Passport

## Objective

Harden participant-controlled access-needs sharing: purpose-bound consent, disclosure receipts, revocation enforcement, and compatibility projection against the Access Graph — without diagnosis-based matching.

## Non-goals

- Universal disability record
- Diagnosis for matching
- Provider-owned passport
- Automatic employer disclosure

## Prerequisites

- Prompt 01 in progress or merged (graph compatibility projection)
- Portfolio epic: [E02 Personal Access Passport](../innovation/epics/02-personal-access-passport.md)

## Current claim state

**Implemented, not independently verified** — anchors: `AccessPassport`, `lib/consent/*`, `lib/trust/fabric/*`

## Files to create / modify

| Action | Path |
|--------|------|
| Extend | `lib/consent/consent-service.ts` |
| Extend | `lib/trust/fabric/receipt-service.ts` |
| Extend | `lib/trust/fabric/types.ts` — `ACCESS_FIELD_CATEGORIES` |
| Extend | `components/consent/*` |
| Extend | `app/participant/privacy/page.tsx` |
| Create | `tests/passport/revocation-enforcement.test.ts` |
| Create | `tests/passport/disclosure-receipt-audit.test.ts` |
| Extend | `tests/trust-fabric/access-receipts.test.ts` |

## Data model / API changes

- Enforce sub-60-second revocation target on cached passport projections
- Participant-visible access log for all disclosures
- Delegate grants cannot exceed participant-granted scopes
- Compatibility projection: passport requirements vs graph capabilities with explicit gaps

## Tests required

- Revocation invalidates active sessions within SLA
- Disclosure receipts record field categories, purpose, recipient
- Employer scope cannot read diagnosis or unrelated medical fields

## Docs to write

- Update `docs/modules/consent.md` with passport-specific flows

## Commit message (exact)

```
feat: harden personal access passport disclosure controls
```

## Verification checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm test tests/passport tests/trust-fabric`
- [ ] Consent timeline UI shows receipts
- [ ] Revocation test passes with timing assertion

## Rollback notes

Feature-flag passport compatibility projection if regressions found.
