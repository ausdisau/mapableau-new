# Wave 9 migration runbook

**Status:** Wave 9 Phase 32 — schema and federation backfill sequence. **Dry-run first.**

## Preconditions

1. Wave 9 Prisma migration applied in target environment.
2. `pnpm federation:conformance --dry-run` reviewed (or full run in staging).
3. Named human approves each backfill step.

## Sequence

1. **Migrate consent records** — bridge legacy `ConsentRecord` to `ConsentDirective` where purpose and recipient are unambiguous.
2. **Audit consent quality** — purpose strings, recipient categories, revocation chains.
3. **Backfill access vaults** — create `draft` vaults; do **not** auto-activate.
4. **Classify portable data** — tag `ParticipantDataPackage` rows.
5. **Audit delegation** — relationship ≠ authority violations.
6. **Audit identifiers** — no raw user IDs in external-facing stores.
7. **Audit disclosure bypasses** — reconcile egress against gateway manifests.
8. **Audit credential eligibility** — prohibited schema keys, simulator defaults.

## Audit scripts (all support `--dry-run`)

```bash
pnpm federation:migrate-consent-records-v2 --dry-run
pnpm federation:audit-consent-purpose --dry-run
pnpm federation:audit-consent-recipients --dry-run
pnpm federation:backfill-access-vaults --dry-run
pnpm federation:classify-portable-data --dry-run
pnpm federation:audit-delegate-authority --dry-run
pnpm federation:audit-external-identifiers --dry-run
pnpm federation:audit-credential-eligibility --dry-run
pnpm federation:audit-disclosure-bypasses --dry-run
```

Pack-expected entry points also exist at `scripts/*.ts` (delegates to `scripts/federation/*`).

Reports write to `artifacts/federation/`.

## Activation (post-migration)

Do **not** set `FEDERATION_ACTIVATION=true` until:

- All audit scripts pass or exceptions are documented.
- Human-approved trust registry and schema entries exist.
- Participant wallet and recovery UX is verified (`pnpm federation:test-wallet-recovery`).

## Rollback

Directive and vault rows are append-only. Rollback is forward-fix (new withdrawn directive, vault deactivation) — not hard delete of audit history.

## See also

- [Wave 9 pack overview](./wave-9-participant-access-federation.md)
- [Wave 9 architecture](./wave-9-architecture-and-gap-analysis.md)

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
