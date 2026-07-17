# Wave 2 — Privacy-safe claim storage and approval governance

## Threats addressed

- Raw participant NDIS numbers persisted in ordinary claim JSON / list responses
- Global `NdiaPilotApprovalRecord` authorising any claim
- Unrelated or stale approvals authorising submission
- Production encryption falling back to `NEXTAUTH_SECRET` or hard-coded keys

## Snapshot lifecycle

1. Claim built in memory (may decrypt NDIS number server-side)
2. Immutable `NdisClaimSnapshot` created (masked JSON + encrypted external payload + payload hash)
3. Ordinary claim row stores **masked** JSON + `currentSnapshotId` + `payloadHash`
4. Material edits create a new snapshot and supersede the previous one
5. Previous approvals cannot authorise the new snapshot

## Approval lifecycle

- Approval is bound to `claimSnapshotId` + `organisationId` + `payloadHash`
- Must be `approved`, unexpired, not revoked; snapshot must not be superseded
- `NdiaPilotApprovalRecord` is **not** claim authority
- Self-managed / plan-managed / private / unknown cannot receive direct-submission approval
- Unregistered organisations cannot enter the NDIA direct-submission path

## Encryption

See [encryption-key-rotation.md](./encryption-key-rotation.md).

## Compatibility

- Existing `/api/provider/ndia-claims` and `/api/ndis/**` continue to work
- List/detail return masked payloads only
- Mock submit is labelled as mock/simulation, not a real NDIA submission
- No live NDIA connectivity was added in this wave

## Limitations / Wave 3

- Pricing remains on the mutable catalogue path — Wave 3 introduces release-versioned pricing
- Full remittance reconciliation is Wave 7
- Stage C redaction of legacy unsafe JSON is a later explicitly approved migration

## Rollback

1. Revert this PR / migration (forward-only: add compensating migration if already applied)
2. Stop writing snapshots; existing encrypted profile numbers remain readable
3. Do not delete snapshot evidence during rollback without privacy review
