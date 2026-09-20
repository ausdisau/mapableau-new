# PR #589 RED baseline

GitHub Actions Security on the NPTM stack currently reports seven unresolved high/critical production advisories before any NPTM-specific security checks execute:

- `fast-uri` — GHSA-F65P-4M7J-42XC — high — path `@openai/agents -> @openai/agents-core -> @modelcontextprotocol/sdk -> ajv -> fast-uri`
- `fast-uri` — GHSA-FPH4-WMHF-6FWF — high — same chain
- `fast-uri` — GHSA-JQFF-G426-HQXP — high — same chain
- `next` — GHSA-P293-QW3H-JR36 — critical
- `maplibre-gl` — GHSA-JRC7-96C5-Q579 — critical
- `sharp` — GHSA-RGJ7-G3M4-5G8C — high — path `next -> sharp`
- `next` — GHSA-2XP9-VWFH-VXW4 — critical

No advisory allowlist entry is an acceptable GREEN condition for these findings. Expected GREEN condition: the production dependency graph resolves patched versions and `pnpm ci:prod-audit` passes without these seven advisories.
