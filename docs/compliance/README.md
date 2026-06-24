# Compliance and audit readiness

MapAble maintains a **dual-track** control register for:

- **SOC 2** (AICPA Trust Services Criteria) — commercial assurance
- **IRAP / ISM** (Australian Government) — agency adoption at a defined classification

> **MapAble is not SOC 2 certified and has not completed an IRAP assessment.** In-app security readiness features and this documentation support preparation only. See `lib/compliance-evidence/audit-control-catalog.ts` for the machine-readable register.

## Documents

| Document | Purpose |
|----------|---------|
| [soc2-tsc-mapping.md](./soc2-tsc-mapping.md) | SOC 2 TSC control matrix, evidence, gaps |
| [irap-ism-mapping.md](./irap-ism-mapping.md) | IRAP/ISM control matrix, SSP inputs, gaps |
| [crosswalk.md](./crosswalk.md) | SOC 2 ↔ ISM overlap and shared remediation |
| [subprocessor-register.md](./subprocessor-register.md) | Vendor inherited controls (CC9 / ISM-1635) |
| [audit-evidence-pack.md](./audit-evidence-pack.md) | Folder structure for external auditors |

## In-app artifacts

| Artifact | Location |
|----------|----------|
| Control catalog (source of truth) | `lib/compliance-evidence/audit-control-catalog.ts` |
| DB seed | `lib/compliance-evidence/seed-audit-controls.ts` |
| Audit events | `lib/audit/audit-event-service.ts` |
| Compliance controls | `ComplianceControl` + `SecurityControl` models |
| Admin UI | `/admin/security-readiness` |

## Seeding controls

After migrations:

```bash
pnpm exec tsx -e "import { seedAuditControlCatalog } from './lib/compliance-evidence/seed-audit-controls'; seedAuditControlCatalog().then(console.log)"
```

Or run full seed (`pnpm db:seed`) which includes Phase 5 audit catalog seeding.

## Remediation alignment

Security remediation phases from the manual audit map to control IDs:

| Phase | Controls affected |
|-------|-------------------|
| Phase 0–1 | CC6.1, ISM-1410, ISM-1504 |
| Phase 2 | P4.1, ISM-1546, NDIS SDM access |
| Phase 3 | CC6.7, CC7.1, ISM-0457, ISM-1657 |

## Certification disclaimer

Do not claim SOC 2, IRAP, ISO 27001, or NDIS regulatory certification unless an external auditor or IRAP assessor has issued the formal report. Product copy is guarded in `lib/config/y5-rights-infrastructure.ts`.
