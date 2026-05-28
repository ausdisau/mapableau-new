# SMART CONTRACT RUNNER

The smart contract runner evaluates JSON rules against runtime context and
persists run/finding history for auditability.

## Service agreement lifecycle integration

Agreement activation is now gated by `SERVICE_AGREEMENT_ACTIVATION_V1` before a
`signed` agreement can move to `active`.

Activation flow:
1. Service agreement lifecycle service assembles activation context.
2. `runSmartContract` executes rules for the activation contract.
3. If result is:
   - `passed`: agreement transitions to `active`
   - `blocked` or `review_required`: activation fails with structured findings

## Contract run outputs

- `SmartContractRun` row with:
  - `result` (`passed|blocked|review_required|not_applicable`)
  - `contextJson`
  - `findingsJson`
- `SmartContractRunFinding` rows for per-rule violations
- audit event `contract.run`
- attestation on `passed` runs

See also: `README_SERVICE_AGREEMENTS.md`.

