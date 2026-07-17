# Disclosure gateway

**Status:** Wave 9 Phase 32 — mandatory external egress.

Every external release of participant data MUST pass through `discloseParticipantData(input)` in `lib/data-federation/disclosure-gateway.ts`. Bypass paths are audited by `federation:audit-disclosure-bypasses`.

## Steps

1. Evaluate `ConsentDirective` for (subject, purpose, recipient).
2. Apply field minimisation and redaction.
3. Write `DisclosureManifest` and audit event.
4. Optionally link to `CredentialPresentation`.

Full detail: [wave-9-disclosure-gateway.md](./wave-9-disclosure-gateway.md).

## Threat model

[docs/security/selective-disclosure-threat-model.md](../security/selective-disclosure-threat-model.md)

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
