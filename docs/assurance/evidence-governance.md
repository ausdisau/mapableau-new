# Evidence governance

Assurance evidence is stored in `AssuranceEvidence` with governance metadata. Legacy `SecurityEvidence` remains as a thin compat pointer.

## Classification

| Classification | Exportable |
|----------------|------------|
| `internal` | Yes |
| `auditor` | Yes |
| `restricted` | No — excluded from auditor bundles |

## Integrity

- **Checksum** — SHA-256 over title, type, summary, document ID, and collection timestamp.
- **Freshness** — per-control `evidenceFreshnessDays`; stale evidence blocks readiness.
- **Supersession** — only one `isCurrent` record per control lineage.

## Operations

- List: `/admin/assurance/evidence`
- Freshness audit: `pnpm assurance:audit-evidence` (wrapper: `scripts/audit-evidence-freshness.ts`)
- Backfill legacy pointers: `tsx scripts/backfill-security-evidence.ts --dry-run`

See also [controls and evidence](./controls-and-evidence.md) and [evidence linkage](./evidence-linkage.md).

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Evidence records do not constitute an NDIA technical pack.
