# Consent receipts

**Status:** Wave 9 Phase 32 — participant-auditable receipt chain.

Each `ConsentDirective` version emits a `ConsentReceipt` with a hash chain so participants (and auditors) can verify "on this day I authorised this purpose for this recipient category" without trusting a mutable row.

## Properties

- Hash-chained per directive history (`lib/consent-v2/receipts.ts`).
- Linked to `ConsentUseEvent` when data is actually used.
- Withdrawal mints a new receipt for the withdrawn version; prior receipts remain valid evidence of past lawful processing.

## Audit scripts

```bash
pnpm federation:audit-consent
pnpm federation:audit-consent-purpose
pnpm federation:audit-consent-recipients
```

## See also

- [Consent directives](./consent-directives.md)
- [Data provenance](./data-provenance.md)
- [Wave 9 consent v2](./wave-9-consent-v2.md)

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
