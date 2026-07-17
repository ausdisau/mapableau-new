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

## Cross-links

- Architecture & gap analysis: `docs/federation/wave-9-architecture-and-gap-analysis.md`
- Consent v2: `docs/federation/wave-9-consent-v2.md`
- Delegation: `docs/federation/wave-9-delegation.md`
- Credentials: `docs/federation/wave-9-credentials.md`
- Wallet: `docs/federation/wave-9-wallet.md`
- Disclosure gateway: `docs/federation/wave-9-disclosure-gateway.md`
- Access passport: `docs/federation/wave-9-access-passport.md`
- Interoperability shells: `docs/federation/wave-9-interoperability.md`
- Conformance: `docs/federation/wave-9-conformance.md`
- Threat models: `docs/security/wallet-threat-model.md`,
  `docs/security/credential-federation-threat-model.md`,
  `docs/security/selective-disclosure-threat-model.md`,
  `docs/security/delegation-threat-model.md`
