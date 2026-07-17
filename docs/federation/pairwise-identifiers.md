# Pairwise identifiers

**Status:** Wave 9 Phase 32 — correlation-resistant subject IDs.

External verifiers receive a `PairwiseSubjectIdentifier` per `(participant, entity)` tuple. Raw `User.id`, email, and NDIS numbers must never appear as credential subject identifiers — colluding verifiers could otherwise correlate participants across services.

## Configuration

- `FEDERATION_PAIRWISE_SECRET` required outside dev.
- DIDs are optional; identifiers are opaque HMAC-derived strings, not on-chain.

## Audit

```bash
pnpm federation:audit-external-identifiers
pnpm federation:audit-identifiers
```

## See also

- [MapAble VC profile](./mapable-vc-profile.md)
- [Wave 9 architecture](./wave-9-architecture-and-gap-analysis.md) §3.4

## Implementation

- `lib/identity-federation/privacy.ts`

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
