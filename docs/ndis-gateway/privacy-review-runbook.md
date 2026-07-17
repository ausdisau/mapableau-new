# Privacy review runbook (NDIS claims)

1. Run backfill dry-run and review `artifacts/ndis-claim-backfill-report.json`
2. Investigate IDs under `ids.privacyReview` in admin tooling (never export raw numbers)
3. Confirm participant profile has encrypted NDIS number
4. Re-run backfill for those organisations
5. Only after Stage B sign-off, schedule Stage C redaction migration

## Reminders

- Masked NDIS numbers are still personal information
- Encryption does not replace access control
- Do not enable live external claim submission from this wave
