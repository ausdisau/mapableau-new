# Wave 9 — Credentials

Status: Wave 9 shell. Simulator-only unless production activation is enabled.

> MapAble credentials are **not** government credentials. Prohibited schema
> keys are enforced in `lib/credentials/schemas.ts`.

## Model overview

- `CredentialSchemaDefinition` — schema key, version, attribute shape,
  `isGovernment = false` (always). Prohibited keys refuse creation:
  `NDISParticipantCredential`, `NDISWorkerCredential`,
  `MedicalDiagnosisCredential`, `DisabilityCredential`,
  `DriverLicenceCredential`, `MedicareCredential`, `PassportCredential`.
- `CredentialIssuanceOffer` — every credential is an offer first. The
  participant must accept before an `IssuedCredential` exists.
- `IssuedCredential` — `simulator=true` unless federation activation is on
  and the offer's mode is not `simulator_only`.
- `CredentialPresentationRequest` — verifier-initiated. Participant reviews
  before a `CredentialPresentation` is minted.
- `CredentialStatusList` — bitstring status list, `privateOnly=true` by
  default (see conformance doc).
- `CredentialTrustRegistryEntry` — who is an allowed issuer / verifier for
  what. Only humans can add trust entries.

## No auto-issuance

`refuseAutoIssue()` (in `lib/credentials/issuance.ts`) throws unless an
operator explicitly sets `FEDERATION_ALLOW_AUTO_ISSUE=true`. This blocks
pipelines that would silently mint credentials on data change.

## Files

- `lib/credentials/schemas.ts`
- `lib/credentials/issuance.ts`
- `lib/credentials/presentation.ts`
- `lib/credentials/verification.ts`
- `lib/credentials/status.ts`
- `lib/credentials/trust.ts`
- `lib/credentials/keys.ts`

## Threat model

See `docs/security/credential-federation-threat-model.md`.
