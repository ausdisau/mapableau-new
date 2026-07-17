# Secure SDLC

Development lifecycle controls referenced by [secure SDLC assurance](../assurance/secure-sdlc.md).

## Release checklist

1. `pnpm type-check`
2. `pnpm test`
3. `pnpm lint`
4. No secrets in diff
5. `ASSURANCE_EVALUATION_ENABLED=true` for release readiness reports

## Tools

- `lib/assurance/sdlc/release-gates.ts`
- `pnpm assurance:generate-sbom`

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
