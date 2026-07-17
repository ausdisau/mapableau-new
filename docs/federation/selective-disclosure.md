# Selective disclosure

**Status:** Wave 9 Phase 32 — data minimisation for credentials and egress.

Selective disclosure minimises data: verifiers receive only the claims they need, intersected with what the active `ConsentDirective` authorises. Unlisted fields are redacted, not merely omitted from the response.

## Mechanisms

- `planFieldMinimisation` in the disclosure gateway.
- `disclosedClaims` is a strict subset of `credentialSubject`.
- `DisclosureManifest` records requested, minimised, and redacted fields.

## Threat model

[docs/security/selective-disclosure-threat-model.md](../security/selective-disclosure-threat-model.md)

## See also

- [Disclosure gateway](./disclosure-gateway.md)
- [Wave 9 disclosure gateway](./wave-9-disclosure-gateway.md)

## Implementation

- `lib/data-federation/redaction.ts`
- `lib/credentials/presentation.ts`

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
