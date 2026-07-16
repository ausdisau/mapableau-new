# Claim snapshot backfill

```bash
pnpm backfill:ndis-claim-snapshots -- --dry-run
pnpm backfill:ndis-claim-snapshots -- --organisationId=<id> --batchSize=50
```

## Behaviour

- Idempotent: skips records with `currentSnapshotId`
- Builds masked + encrypted snapshots from provider claims and claim lines
- Flags `privacyReviewRequired` when raw numbers were present or NDIS number cannot be reconstructed
- Writes counts/IDs only to `artifacts/ndis-claim-backfill-report.json`

## Stages

- **A:** add snapshots, link records, identify unsafe legacy rows
- **B:** verify backfill + privacy review report
- **C:** later explicitly approved migration to redact remaining unsafe legacy JSON
