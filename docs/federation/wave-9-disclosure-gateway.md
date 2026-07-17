# Wave 9 — Disclosure Gateway

Status: Wave 9 mandatory gateway.

## Rule

Every external release of participant data — whether it goes to another
provider tenant, a credential presentation, an OID4VP response, a FHIR
bundle, an export or an emergency access review — MUST pass through
`discloseParticipantData(input)` in `lib/data-federation/disclosure-gateway.ts`.

The gateway:

1. Evaluates a `ConsentDirective` for the (subject, purpose, recipient)
   tuple. If no active directive matches, the request is either denied or
   flagged `requires_participant_review`.
2. Applies minimisation (`planFieldMinimisation`) — only requested fields
   that are in-scope for the directive make it through; other fields are
   redacted, not just excluded.
3. Writes a `DisclosureManifest` recording requested fields, minimised
   fields, redacted fields, decision, purpose, recipient and simulator
   flag. This row is the single evidence trail for external egress.
4. Emits a `data.external.disclosed` audit event referencing the manifest.
5. Optionally links the manifest to a `CredentialPresentation` (one-to-one
   via `disclosureManifestId`).

## Cross-tenant

The gateway calls `isCrossTenantDisclosure(subject, recipient)`. Cross-tenant
disclosures require the directive's `recipientCategory` to match the
recipient class; a support-coordinator directive cannot silently authorise
disclosure to a plan manager.

## Simulator flag

Manifests carry `simulator = !isFederationActivated()`. External adapters
must refuse to actually transmit unless `simulator = false` and the
verifier's trust registry entry allows it.

## Files

- `lib/data-federation/disclosure-gateway.ts`
- `lib/data-federation/redaction.ts`
- `lib/data-federation/transform.ts`
- `lib/data-federation/audit.ts`
- `lib/data-federation/cross-tenant.ts`

## Threat model

See `docs/security/selective-disclosure-threat-model.md`.
