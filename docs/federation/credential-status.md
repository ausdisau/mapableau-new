# Credential status

**Status:** Wave 9 Phase 32 — bitstring status lists. Private by default.

`CredentialStatusList` uses bitstring status list semantics. `privateOnly=true` by default — per-participant public status URLs would leak correlatable identifiers.

## Revocation

Revocation updates status list state; it does not erase issuance history or prior lawful presentations. Withdrawal of consent limits **future** sharing.

Public exposure requires `FEDERATION_STATUS_LIST_PUBLIC=true` **and** a documented privacy assessment (see [federation conformance](./federation-conformance.md)).

## Test

```bash
pnpm federation:test-status
```

## See also

- [Wave 9 credentials](./wave-9-credentials.md)
- [Credential trust framework](./credential-trust-framework.md)

## Implementation

- `lib/credentials/status.ts`

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
