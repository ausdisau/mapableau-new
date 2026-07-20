# Audit evidence pack structure

Use this layout when preparing materials for **SOC 2 Type I/II** or **IRAP** assessors.

```
audit-pack-YYYY-MM/
├── 00-executive-summary.pdf          # Scope, period, exclusions
├── 01-policies/                      # ISP, access, IR, privacy, retention
├── 02-architecture/                  # Diagrams, data flows, boundary
├── 03-soc2/                          # TSC mapping + test results
│   └── soc2-tsc-mapping.md           # From docs/compliance/
├── 04-irap/                          # SSP inputs, ISM mapping
│   └── irap-ism-mapping.md
├── 05-access/                        # RBAC matrix, access review records
├── 06-logging/                       # AuditEvent samples (redacted)
├── 07-crypto/                        # NDIS encryption design, key mgmt
├── 08-change/                        # PR samples, deploy logs
├── 09-incidents/                     # IR exercises, incident samples
├── 10-vendors/                       # Subprocessor register + SOC reports
├── 11-testing/                       # Semgrep, SCA, pen test
└── 12-privacy/                       # RoPA, consent samples, retention proof
```

## Export from MapAble admin

| Evidence | Export path |
|----------|-------------|
| Audit events | `GET /api/admin/audit-events` |
| Compliance controls | `GET /api/admin/compliance` |
| Security frameworks | `/admin/security-readiness` |
| External audit packs | `POST /api/admin/security-audit-packs` |
| Evidence automation | `POST /api/admin/evidence-automation` |

## Redaction rules

Before export:

- Remove NDIS numbers, passwords, secrets from JSON (audit service already redacts metadata keys).  
- Use participant IDs only, not names, in samples unless assessor NDA covers PHI.

## Catalog sync

Control IDs in this pack must match `lib/compliance-evidence/audit-control-catalog.ts`. After catalog updates, re-seed:

```bash
pnpm exec tsx -e "import { seedAuditControlCatalog } from './lib/compliance-evidence/seed-audit-controls'; seedAuditControlCatalog().then(console.log)"
```
