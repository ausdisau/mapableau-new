# Essential Eight ML2 Readiness — MapAble Go

**Claim state:** TARGET — **not** Essential Eight compliant or ML2 achieved

## Summary

MapAble Go development aligns toward ML2 but independent verification is required before any promotion claim.

## MapAble Go-specific additions (slice 1)

| Control area | Implementation |
| ------------ | -------------- |
| Feature flags default off | `MAPABLE_GO_*` in `.env.example` |
| Wheelchair boundary | CI scan for prohibited MCP/action vocabulary |
| Location privacy | `GoLocationSession` with purpose + expiry; no continuous tracking |
| Audit | `GO_*` audit actions without precise coordinates in logs |
| Provenance | AI_INFERRED cannot become HUMAN_VERIFIED silently |

## CI outputs

`pnpm ci:mapable-go-security` → PASS | FAIL | MANUAL_REVIEW_REQUIRED

Never output "ESSENTIAL EIGHT COMPLIANT".
