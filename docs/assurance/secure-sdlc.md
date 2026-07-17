# Secure SDLC

Release gates and secure development lifecycle controls for Wave 6.

## Release gates

`evaluateReleaseGates()` checks:

| Gate | Requirement |
|------|-------------|
| `type_check` | TypeScript passes |
| `tests` | Required tests pass |
| `assurance_eval_flag` | `ASSURANCE_EVALUATION_ENABLED` on |
| `no_secrets_in_diff` | No secrets in change diff |

## SBOM

`pnpm assurance:generate-sbom` — software bill of materials for assurance evidence.

## Location

- `lib/assurance/sdlc/release-gates.ts`
- `lib/assurance/sdlc/report-generators.ts`

See [security/sdlc/README.md](../security/sdlc/README.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Passing release gates is necessary but not sufficient for production go-live.
