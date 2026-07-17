# Architecture evidence

Architecture drift checks and evidence for NDIA integration posture.

## Drift check

`checkArchitectureDrift()` in `lib/assurance/architecture/drift-check.ts` detects:

- Missing expected adapter modes
- Direct NDIA paths without external approval evidence (high severity)

Run: `pnpm assurance:architecture-drift`

## Expected adapter modes

- `ndia_simulator`
- `ndia_manual_portal`
- `ndia_direct_future` (placeholder — requires approval evidence)

## Admin

`/admin/assurance/architecture`

See [architecture/README.md](./architecture/README.md) for index.

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Architecture evidence does not constitute an NDIA technical assessment.
