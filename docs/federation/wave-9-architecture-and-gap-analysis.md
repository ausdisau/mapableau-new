# Wave 9 — Participant-controlled credentials and consent federation
## Architecture and gap analysis

Status: draft (Wave 9). Not government / not regulator-approved. Federation and
credential issuance are configuration-gated and simulator-only unless an
operator explicitly enables production activation with a signed conformance
record.

> **Amber disclaimer.** MapAble credentials are *platform-issued attestations*
> about access, service history and participant preferences. They are **not**
> government credentials, not NDIS credentials, not clinical / medical records
> and not disability status determinations. Any receiving party MUST treat
> them accordingly.

## 1. Goals

- Give participants durable, portable control over which parties can see, use
  or receive their MapAble data — before, during and after any single provider
  relationship.
- Replace the legacy boolean `checkConsent` semantics with a **directive**
  layer that records purpose, recipient category, timing, revocation and
  receipts, while preserving the old boolean API as a fail-closed projection.
- Prepare the technical shells for interoperable credential exchange
  (OID4VCI / OID4VP / W3C VC Data Model 2.0 / Bitstring Status List) so that
  MapAble can eventually plug in to Australian government trust frameworks
  without exposing participants to premature "wallets" or public ledger
  correlation risks today.
- Establish that **relationship ≠ authority**: a family member, emergency
  contact, plan manager or support coordinator has a relationship — they do
  not automatically have billing, legal or consent authority.

## 2. Non-goals

- No public blockchain, no on-chain identifiers, no worldwide-scannable
  bitstring status lists per participant.
- No auto-issued government credentials (NDISParticipantCredential,
  MedicalDiagnosisCredential, DisabilityCredential are explicitly banned
  schema names).
- No AI-granted consent, AI-signed credentials, AI-approved emergency access,
  AI-approved delegation, AI-completed high-risk recovery, or AI-established
  issuer trust. Every one of those must have a human decision recorded.
- No auto wallet activation. A participant must explicitly opt in to a wallet
  and complete a recovery policy before any keys are provisioned.
- Federation does **not** grant a federation partner access to any participant
  data. Federation is a governance / discovery / trust-framework relation.
  Participant data access still requires a directive, a disclosure package
  and a receipt.

## 3. Gap analysis from Phase 1 audit

The audit identified the following concrete holes that Wave 9 must close.

### 3.1 `checkConsent` returns true too easily
`lib/consent/consent-service.ts::checkConsent` runs a `findFirst` against
`ConsentRecord`. If **both** `grantedToUserId` and `grantedToOrganisationId`
are omitted, the query effectively matches any active record for the subject
in that scope — regardless of recipient — and returns `true`. Fix: require an
explicit grantee. When omitted, return `false` (fail-closed) and log an audit
event `consent.check.grantee_missing`.

### 3.2 Mutable revoke loses history
`revokeConsent` mutates the same row in place (`status = revoked`,
`revokedAt`, `revokedBy`) — historical grant metadata is preserved only in
audit events, not in a queryable form. Wave 9 adds `ConsentDirective` which is
**append-only**. Revoke = new version with `decision = withdrawn`. Old
directives remain queryable for provenance.

### 3.3 Relationship ≠ authority
`lib/support-coordinator/consent-gate.ts::hasActiveConsentForCoordinator`
returns true whenever a `SupportCoordinatorRelationship` is in `active`
status. That treats a relationship as authority. Wave 9 requires that the
gate also verify an active `ConsentRecord` (or, preferably, an active
non-withdrawn `ConsentDirective`) whose purpose covers the current action.

### 3.4 Raw user IDs leak across boundaries
Nothing today prevents an external app or verifier from being handed the
participant's raw `User.id`, `email` or NDIS number as a subject identifier.
Wave 9 introduces `PairwiseSubjectIdentifier`: per (participant, verifier
entity) an opaque, non-reversible ID is minted so that colluding verifiers
cannot correlate.

### 3.5 No receipts / no ledger
There is no artifact a participant can hand to an auditor showing "on this
day I authorised this share, and the recipient acknowledged the constraints".
Wave 9 introduces `ConsentReceipt` (hash-chained per directive) and
`ConsentUseEvent` (every actual data use referenced back to a directive +
receipt).

### 3.6 No disclosure gateway
Any code path that reads participant data can, in principle, expose it to a
third party. Wave 9 introduces `discloseParticipantData(input)` in
`lib/data-federation/` as the **mandatory** external-facing egress function
for participant data: it evaluates a directive, mints or reuses a receipt,
applies redaction/minimisation, records a `ConsentUseEvent` and returns the
minimised payload. Any external route that returns participant data without
going through this gateway is a bug and audited by
`federation:audit-disclosures`.

### 3.7 No portable claim model
Access-fit, accreditation and lived-experience information cannot be
extracted from MapAble in a form the participant can present elsewhere.
Wave 9 introduces `PortableClaim` (participant-controlled, provenance-tagged
statements) and, on top, `IssuedCredential` (VC-shaped envelope, still
platform-scoped by default).

### 3.8 No wallet, no recovery policy, no device binding
Even if a credential were issued, MapAble had no place to hold the key
material safely. Wave 9 introduces `ParticipantWallet`,
`WalletKeyReference` (references to the actual key material held in a
platform KMS or an external device — never the raw private key),
`WalletRecoveryPolicy`, `WalletRecoveryEvent` and `WalletDevice`. No wallet
is provisioned until the participant explicitly activates it and confirms a
recovery policy. AI cannot complete high-risk recovery.

### 3.9 No trust registry
Nothing prevents a rogue schema name (e.g. `NDISParticipantCredential`) from
being defined or a rogue verifier from claiming an MapAble-issued
credential. Wave 9 introduces `CredentialTrustRegistryEntry` and
`CredentialSchemaDefinition` with a hard-coded prohibition on the
government-credential names.

## 4. Coexistence plan

- `ConsentRecord` **stays**. It remains the queryable "does org X currently
  hold consent for scope Y" answer.
- `ConsentDirective` is layered above it. New writes go through
  `writeConsentDirective(...)` which:
  1. Persists the directive (immutable version).
  2. Emits a `ConsentReceipt` for the participant.
  3. Optionally mirrors an active grant into `ConsentRecord` (with
     `directiveId` FK) for backwards compatibility with existing scope-based
     gates.
- Old grant/revoke UI flows continue to work. Deprecation is documented in
  `docs/federation/consent-directives.md`.
- `checkConsent` is hardened as described in 3.1, and additionally, if a
  matching directive exists whose `decision != active`, it fails closed
  regardless of whether the legacy `ConsentRecord.status` is still `active`.
- Support-coordinator and family-member roles get **read-only** relationship
  status but must still hold a matching directive/record before crossing any
  authority-requiring boundary.

## 5. Boundaries (Waves 2–8 preserved)

- Tenant boundary from Wave 8 (`Organisation.id`) is unchanged. Federation
  membership is stored on the org record, but no cross-tenant read is added.
  All disclosure crosses tenants only via `discloseParticipantData`.
- Wave 6 assurance evidence continues to gate GA. Wave 9 does not weaken any
  assurance control; it adds new evidence sources (federation conformance
  runs, disclosure audits, delegation audits).
- Wave 7 pilot bypass rules still apply — Wave 9 credential issuance is
  simulator-only until a participant has explicitly opted in **and** the
  federation:conformance script has passed **and** an operator has enabled
  `FEDERATION_ACTIVATION` in env.

## 6. What is *not* in Wave 9

- Live OID4VCI / OID4VP endpoints against real government issuers.
- Live FHIR PUT/POST to any external system. The FHIR adapter shell records
  intent, translates, then refuses to make the outbound call unless
  `FEDERATION_FHIR_OUTBOUND_ENABLED=true` and a manual runbook step is
  recorded.
- Public-URL bitstring status lists per participant. Status lists are
  supported as an internal privacy-preserving construct; the doc calls out
  that per-participant public URLs would leak a correlatable identifier.

## 7. Cross-links

- `docs/federation/wave-9-participant-access-federation.md` — Phase 32 pack
  entry point.
- `docs/security/wallet-threat-model.md`,
  `credential-federation-threat-model.md`,
  `selective-disclosure-threat-model.md`,
  `delegation-threat-model.md`.
- `docs/assurance/privacy-and-consent.md` — legacy consent doc (preserved).
- `docs/platform/tenant-model.md` — tenant boundary (preserved).
