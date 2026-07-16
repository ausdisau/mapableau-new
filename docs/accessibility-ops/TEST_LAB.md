# Accessibility Test Laboratory

## Wave 2 shadow runners

- Runner script: `runners/accessibility-ops/shadow-web-runner.mjs`
- Signing: `lib/accessibility-ops/runners/signing.ts` (HMAC + result hash + nonce)
- Ingest: `POST /api/internal/accessibility-ops/test-results`
- CI workflow: `.github/workflows/accessibility-ops-shadow.yml`

Results never block releases while gates are off. Lived-experience findings cannot be auto-closed by automated passes.

Required result fields: runnerId, runnerVersion, ruleStableKey, ruleVersionId, assetVersionId, environment, testedAt, outcome, reasonCodes, nonce, resultHash, signature.
