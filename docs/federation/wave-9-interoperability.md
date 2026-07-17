# Wave 9 — Interoperability shells (FHIR / OID4VCI / OID4VP)

Status: Wave 9. Shells only — no live outbound traffic without an explicit
operator override.

## FHIR

`lib/interoperability/fhir/fhir-adapter-shell.ts` refuses network operations
unless `FEDERATION_FHIR_ACTIVATION=true` AND a signed conformance record is
present. Mappers exist to translate:

- `ConsentDirective` → FHIR `Consent` resource (see `consent-mapper.ts`)
- `DisclosureManifest` → FHIR `Provenance` resource (see `provenance-mapper.ts`)

These mappers are pure functions; they do not perform I/O.

## OID4VCI

`lib/federation-conformance/oid4vci.ts` builds well-known issuer metadata
that advertises the *simulator* profile. `refuseProductionIssuance(ctx)`
throws unless `FEDERATION_ACTIVATION=true`.

## OID4VP

`lib/federation-conformance/oid4vp.ts` mirrors the issuance shell for
presentations. `refuseProductionPresentation(ctx)` blocks production
presentation flows until activation.

## VC Data Model

`lib/federation-conformance/vc-data-model.ts` provides a syntactic check
against W3C VC Data Model 2.0 requirements (context, type, issuer, credential
subject, proof). It does not verify signatures.

## Files

- `lib/interoperability/fhir/consent-mapper.ts`
- `lib/interoperability/fhir/provenance-mapper.ts`
- `lib/interoperability/fhir/fhir-adapter-shell.ts`
- `lib/federation-conformance/oid4vci.ts`
- `lib/federation-conformance/oid4vp.ts`
- `lib/federation-conformance/vc-data-model.ts`
