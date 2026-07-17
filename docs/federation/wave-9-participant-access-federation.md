# Wave 9 — Participant-controlled credentials and consent federation

Status: Wave 9 delivery pack. Not government / not regulator-approved.

> **Amber disclaimer.** MapAble credentials are platform-issued attestations,
> not government credentials, not NDIS credentials, not disability status
> determinations. Federation surfaces default to simulator mode.

## What Wave 9 delivers

1. An immutable `ConsentDirective` layer alongside the legacy `ConsentRecord`.
   Directives carry purpose, recipient category, decision, expiry and receipts;
   revocation creates a new `withdrawn` version rather than mutating history.
2. A `ParticipantAccessVault` that participants must explicitly activate before
   any external disclosure or credential issuance is available. Vault
   activation is opt-in — MapAble never auto-activates.
3. A `DelegateAuthority` model that makes **relationship ≠ authority** explicit.
   Family / emergency contacts are relationships. Billing, legal, plan-manager
   authority requires a verified `DelegateAuthority` with a verification level
   that matches the authority category (see `wave-9-delegation.md`).
4. Credential shells: `IssuedCredential`, `CredentialIssuanceOffer`,
   `CredentialPresentationRequest`, `CredentialPresentation`,
   `CredentialSchemaDefinition`, `CredentialStatusList`,
   `CredentialTrustRegistryEntry`. Prohibited government-mimicking schema keys
   are hard-coded in `lib/credentials/schemas.ts`.
5. A `ParticipantWallet` scaffold with device bindings, opaque key references,
   and recovery policies. High-risk recovery methods require a human reviewer.
6. Federation privacy: pairwise subject identifiers per `(participant, entity)`
   so no external verifier can correlate a MapAble participant with another
   using raw user IDs, emails or NDIS numbers.
7. A single mandatory disclosure gateway (`discloseParticipantData`) that
   enforces consent, minimisation, purpose match and receipt generation before
   any participant data leaves MapAble.
8. OID4VCI / OID4VP / Bitstring Status List adapters shipped as **shells**.
   Production activation is refused unless `FEDERATION_ACTIVATION=true` and a
   passing conformance run is on file.

## What Wave 9 does not deliver

- No live outbound FHIR calls. `lib/interoperability/fhir/fhir-adapter-shell.ts`
  refuses network operations unless an operator sets an explicit override.
- No auto-issue of credentials. Every credential is an *offer* first and the
  participant must accept from their wallet UI.
- No public per-participant status list URLs. `CredentialStatusList.privateOnly`
  defaults to `true`.
- No government issuer / regulator trust. MapAble is not a government issuer.

## Phase 32 documentation index

| Topic | Document |
|-------|----------|
| Pack entry / architecture | [wave-9-architecture-and-gap-analysis.md](./wave-9-architecture-and-gap-analysis.md) |
| Participant access vault | [participant-access-vault.md](./participant-access-vault.md) |
| Data package catalogue | [data-package-catalogue.md](./data-package-catalogue.md) |
| Data provenance | [data-provenance.md](./data-provenance.md) |
| Consent directives | [consent-directives.md](./consent-directives.md) |
| Consent receipts | [consent-receipts.md](./consent-receipts.md) |
| Delegation & supported decision-making | [delegation-and-supported-decision-making.md](./delegation-and-supported-decision-making.md) |
| Credential trust framework | [credential-trust-framework.md](./credential-trust-framework.md) |
| Credential schema registry | [credential-schema-registry.md](./credential-schema-registry.md) |
| MapAble VC profile | [mapable-vc-profile.md](./mapable-vc-profile.md) |
| Wallet architecture | [wallet-architecture.md](./wallet-architecture.md) |
| Wallet recovery | [wallet-recovery.md](./wallet-recovery.md) |
| OID4VCI profile | [oid4vci-profile.md](./oid4vci-profile.md) |
| OID4VP profile | [oid4vp-profile.md](./oid4vp-profile.md) |
| Selective disclosure | [selective-disclosure.md](./selective-disclosure.md) |
| Credential status | [credential-status.md](./credential-status.md) |
| Pairwise identifiers | [pairwise-identifiers.md](./pairwise-identifiers.md) |
| Disclosure gateway | [disclosure-gateway.md](./disclosure-gateway.md) |
| FHIR consent mapping | [fhir-consent-mapping.md](./fhir-consent-mapping.md) |
| Accessibility passport | [accessibility-passport.md](./accessibility-passport.md) |
| Emergency access | [emergency-access.md](./emergency-access.md) |
| Portable export / import | [portable-export-import.md](./portable-export-import.md) |
| Cross-provider portability | [cross-provider-portability.md](./cross-provider-portability.md) |
| Federation conformance | [federation-conformance.md](./federation-conformance.md) |
| Migration runbook | [wave-9-migration-runbook.md](./wave-9-migration-runbook.md) |

### Wave 9 topic guides (concise)

- Consent v2: [wave-9-consent-v2.md](./wave-9-consent-v2.md)
- Delegation: [wave-9-delegation.md](./wave-9-delegation.md)
- Credentials: [wave-9-credentials.md](./wave-9-credentials.md)
- Wallet: [wave-9-wallet.md](./wave-9-wallet.md)
- Disclosure gateway: [wave-9-disclosure-gateway.md](./wave-9-disclosure-gateway.md)
- Access passport: [wave-9-access-passport.md](./wave-9-access-passport.md)
- Interoperability shells: [wave-9-interoperability.md](./wave-9-interoperability.md)
- Conformance: [wave-9-conformance.md](./wave-9-conformance.md)

## Threat models

- [docs/security/wallet-threat-model.md](../security/wallet-threat-model.md)
- [docs/security/credential-federation-threat-model.md](../security/credential-federation-threat-model.md)
- [docs/security/selective-disclosure-threat-model.md](../security/selective-disclosure-threat-model.md)
- [docs/security/delegation-threat-model.md](../security/delegation-threat-model.md)

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
