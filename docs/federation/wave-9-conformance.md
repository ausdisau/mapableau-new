# Wave 9 — Federation conformance

Status: Wave 9. `pnpm federation:conformance` runs the conformance suite.

## Checks

1. **Privacy** — `lib/federation-conformance/privacy.ts`
   - `FEDERATION_PAIRWISE_SECRET` is set outside dev
   - `FEDERATION_STATUS_LIST_PUBLIC` requires an accompanying privacy
     assessment
   - No live outbound FHIR without an explicit operator override
2. **Accessibility** — `lib/federation-conformance/accessibility.ts`
   - Plain-language disclaimer present on federation UI
   - Amber banner "MapAble credentials are not government credentials"
   - Screen-reader-friendly labels
3. **VC Data Model** — `lib/federation-conformance/vc-data-model.ts`
4. **OID4VCI / OID4VP** — refuse production activation without
   `FEDERATION_ACTIVATION`
5. **Status list** — private-only default; public exposure requires the
   `FEDERATION_STATUS_LIST_PUBLIC` flag and a documented assessment

## Activation gate

Production activation is a joint check. All of the following must hold
before any real credential moves:

- `FEDERATION_ACTIVATION=true`
- Passing `pnpm federation:conformance` output on file
- Human-approved `CredentialTrustRegistryEntry` for the issuer/verifier
- Human-approved `CredentialSchemaDefinition` for the credential shape

AI cannot flip any of these.
