# Federation conformance

**Status:** Wave 9 Phase 32 — activation gate. Not certification.

External interoperability requires conformance. Run:

```bash
pnpm federation:conformance
```

## Checks (summary)

1. **Privacy** — pairwise secret set; status list public exposure gated; no live FHIR without override.
2. **Accessibility** — plain-language disclaimers and amber banner on federation UI.
3. **VC Data Model** — syntactic profile validation.
4. **OID4VCI / OID4VP** — refuse production without `FEDERATION_ACTIVATION=true`.
5. **Status list** — `privateOnly` default.

Production activation additionally requires human-approved trust registry entries and schema definitions. AI cannot flip activation flags.

Full detail: [wave-9-conformance.md](./wave-9-conformance.md).

## Implementation

- `lib/federation-conformance/*`
- `scripts/federation/conformance.ts`

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
