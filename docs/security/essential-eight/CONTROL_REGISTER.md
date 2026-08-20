# Essential Eight — Control Register (MapAble Go)

**Target:** ESSENTIAL_EIGHT_TARGET=ML2  
**Claim state:** TARGET — not a conformity claim

| # | Control | Status | Notes |
| - | ------- | ------ | ----- |
| 1 | Patch applications | PARTIAL | pnpm lockfile; Dependabot placeholder being fixed; `ci:prod-audit` |
| 2 | Patch operating systems | EXTERNAL_CONTROL / REQUIRES_HUMAN_VERIFICATION | Vercel, Neon, GitHub runners, developer devices |
| 3 | Multi-factor authentication | PARTIAL | Passkeys + WebAuthn available; owner verification required for admin identities |
| 4 | Restrict administrative privileges | PARTIAL | RBAC in `lib/auth/permissions.ts`; break-glass MFA |
| 5 | Application control | PARTIAL | CI gates; no auto-exec of model output |
| 6 | Restrict Microsoft Office macros | NOT_APPLICABLE / REQUIRES_HUMAN_VERIFICATION | Organisational endpoint control |
| 7 | User application hardening | PARTIAL | CSP (report-only default), HSTS, secure cookies; preview-only CSP enforce tests |
| 8 | Regular backups | REQUIRES_HUMAN_VERIFICATION | Neon snapshots; restore `NOT_RUN` per BACKUP_RESTORE.md |

Status vocabulary: VERIFIED | PARTIAL | NOT_IMPLEMENTED | NOT_APPLICABLE | EXTERNAL_CONTROL | REQUIRES_HUMAN_VERIFICATION
