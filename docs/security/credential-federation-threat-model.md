# Threat model — Credential federation (Wave 9)

Status: Wave 9. Non-regulator. Amber disclaimer applies.

## Assets

- `IssuedCredential` rows (simulator by default)
- `CredentialSchemaDefinition` — the shape of what MapAble is willing to
  issue
- `CredentialTrustRegistryEntry` — who is allowed to issue or verify
- `CredentialStatusList` — private-only revocation state

## Adversaries

- **Rogue issuer.** An external entity claims to be a government-authoritative
  issuer via MapAble.
- **Silent auto-mint.** A pipeline change starts minting credentials on
  data change without a participant offer.
- **Public correlation.** An attacker scrapes a public status list URL to
  identify a specific participant's credential events.
- **Government mimicry.** A schema is created that looks like a government
  credential (e.g. `NDISParticipantCredential`).
- **Verifier over-request.** A verifier asks for the entire credential
  when only a single claim is needed.

## Controls

- Prohibited schema keys are hard-coded in `lib/credentials/schemas.ts` and
  refused at write time.
- `refuseAutoIssue()` blocks silent auto-mint pipelines.
- `CredentialStatusList.privateOnly = true` by default;
  `FEDERATION_STATUS_LIST_PUBLIC=true` is required to expose a list AND
  a privacy assessment must exist.
- Every credential defaults to `simulator=true` until federation is
  activated and the offer is not `simulator_only`.
- Presentations flow through the disclosure gateway, which minimises
  disclosed claims (`disclosedClaims` is a strict subset of
  `credentialSubject`).
- Amber "not government credential" banner is a conformance requirement.

## Residual risk

- A malicious operator that both authors a schema and approves the trust
  registry entry can create a misleading credential. Wave 9 requires this
  to be a two-person action; operator collusion is out of scope.

## References

- `lib/credentials/issuance.ts`, `lib/credentials/status.ts`,
  `lib/credentials/schemas.ts`, `lib/federation-conformance/*`
