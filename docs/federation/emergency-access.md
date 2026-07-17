# Emergency access

**Status:** Wave 9 Phase 32 — time-bounded narrow access. Human approval required.

`EmergencyAccessRequest` allows a first-responder or authorised delegate to request time-bounded access to a narrow subset of the access passport (e.g. communication preferences, mobility notes the participant opted in). Every request is **human-reviewed**; AI cannot approve emergency access.

Emergency delegates require `emergency_action` authority with `platform_verified` verification — a relationship alone is insufficient.

## Boundaries

- Access is read-only and time-bounded.
- Withdrawal of consent stops future emergency disclosures; it cannot erase prior lawful emergency access that was already exercised.
- Disclosures still pass through the [disclosure gateway](./disclosure-gateway.md).

## See also

- [Accessibility passport](./accessibility-passport.md)
- [Delegation and supported decision-making](./delegation-and-supported-decision-making.md)
- [Wave 9 access passport](./wave-9-access-passport.md)

## Implementation

- `lib/access-passport/emergency.ts`

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
