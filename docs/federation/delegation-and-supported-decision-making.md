# Delegation and supported decision-making

**Status:** Wave 9 Phase 32 — explicit authority model. Not substitute decision-making law.

A family member, emergency contact, plan manager contact, or support coordinator has a **relationship** with the participant. That alone does **not** confer authority to view data, manage billing, grant consent, or approve credentials.

Authority requires an explicit `DelegateAuthority` row with category and verification level. Delegates act **on behalf of** the participant within scope — they do not impersonate the participant's identity.

Full matrix: [wave-9-delegation.md](./wave-9-delegation.md).

## Categories

`view_data`, `billing_manage`, `legal_representation`, `emergency_action`, `plan_manage` — each maps to a minimum verification level.

## Invariants

- `delegateId != participantId`
- Revocation is append-only (`DelegateAuthorityTransaction`)
- AI cannot approve, escalate, or revoke authority

## Threat model

[docs/security/delegation-threat-model.md](../security/delegation-threat-model.md)

## Implementation

- `lib/delegation/*`
- `pnpm federation:audit-delegate-authority`

## Non-negotiable disclaimers

- **Participant controls future sharing.** Withdrawal limits future use; it cannot erase all previously lawful processing.
- **Consent ≠ legal authority; relationship ≠ authority.** Delegates do not impersonate participants.
- **Self-asserted ≠ verified.**
- **MapAble credentials are not government credentials.** A generated credential does not prove government eligibility.
- **Accessibility preferences are not diagnoses.**
- **Selective disclosure minimises data.** A credential ≠ an access token.
- **DIDs are optional;** no public blockchain is required.
- **Wallet recovery must remain accessible** (with human safeguards for high-risk methods).
- **External interoperability requires conformance.** FHIR mapping may be lossy.
- **No AI may** grant consent, sign credentials, approve delegation, complete high-risk recovery, approve emergency access, or establish issuer trust.
