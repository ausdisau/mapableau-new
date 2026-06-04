# SOC 2 ↔ IRAP/ISM crosswalk

Single remediation items that close gaps on **both** audit tracks.

| Shared fix | SOC 2 | ISM / IRAP | Priority | Phase |
|------------|-------|------------|----------|-------|
| Authenticate all sensitive API routes; fix IDOR | CC6.1 | ISM-1410, ISM-1504 | P0 | 0–1 |
| Enforce MFA for admin / privileged roles | CC6.1 | ISM-1410 | P1 | 2 |
| Privileged access review (quarterly) | CC6.3 | ISM-1504 | P1 | 2 |
| Require `NDIS_ENCRYPTION_KEY` in production | CC6.7 | ISM-0457 | P1 | 3 |
| Semgrep + dependency scanning in CI | CC7.1 | ISM-1657, ISM-1685 | P1 | 3 |
| Security headers (CSP, HSTS) | CC6.6 | ISM-1657 | P2 | 3 |
| Subprocessor risk assessments | CC9.1 | ISM-1635 | P1 | 2 |
| Security incident response plan + NDB | CC7.3 | ISM-0123 | P1 | 2 |
| Operational data retention/deletion | P4.1 | ISM-1546 | P1 | 2 |
| DR restore test + RTO/RPO | A1.1 | ISM-1511 | P2 | 3 |
| Policy pack (ISP, access, IR, privacy) | CC1.1 | ISM-0001 | P1 | 1 |

## Controls with no IRAP equivalent (SOC 2 only)

- **P3.1 consent UX** — Privacy Act / APP aligned; ISM covers spillage differently  
- **Type II observation period** — SOC 2 process requirement, not ISM  

## Controls with no SOC 2 equivalent (IRAP only)

- **ISM-1905 classification boundary** — Agency-specific  
- **Essential Eight maturity reporting** — Australian Government specific  
- **SSP / SAR / POA&M** — IRAP artifact set  

## Status summary (from catalog)

| Track | Implemented / tested | Needs review | Gap open | Not started |
|-------|---------------------|--------------|----------|-------------|
| SOC 2 | 4 | 7 | 2 | 0 |
| IRAP/ISM | 2 | 7 | 2 | 1 |

Run `pnpm test tests/audit-control-catalog.test.ts` to validate catalog integrity after edits.
