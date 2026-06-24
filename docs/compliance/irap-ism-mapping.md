# IRAP / ISM control mapping

**Organisation:** Australian Disability Ltd (MapAble)  
**Framework:** Australian Government ISM + IRAP assessment methodology  
**Prerequisite:** Agency sponsor, system classification, and defined system boundary  

Machine-readable source: `lib/compliance-evidence/audit-control-catalog.ts` (`IRAP_ISM_CONTROLS`).

> **MapAble has not undergone IRAP.** IRAP is commissioned by an Australian Government agency for systems at a defined classification (e.g. OFFICIAL, OFFICIAL: Sensitive, PROTECTED). Commercial NDIS SaaS may never require IRAP unless selling into government.

---

## IRAP prerequisites (before assessor engagement)

| Prerequisite | Owner | Status |
|--------------|-------|--------|
| Agency authorising officer | Government customer | Not started |
| System classification decision | Agency + MapAble | Not started |
| System boundary definition | Engineering + Agency | Partial (see subprocessor register) |
| System Security Plan (SSP) | MapAble + assessor input | Not started |
| Accredited IRAP assessor | Agency | Not started |

---

## Proposed system boundary

```
[User browsers] → TLS → [Vercel Edge / Next.js] → TLS → [Neon Postgres]
                              ↓
                    Subprocessors: Stripe, Twilio, OAuth IdPs, (optional AI)
```

**Data types:** Participant PII, NDIS numbers (encrypted), care/transport records, consent, audit logs.

**Classification note:** Final classification is an **agency decision**. This mapping assumes controls suitable for **OFFICIAL: Sensitive** preparation; PROTECTED would require additional controls not yet implemented.

---

## ISM control matrix

| ISM ref | Title | Status | MapAble evidence | Gaps |
|---------|-------|--------|------------------|------|
| ISM-0001 | Cyber security governance | Needs review | Compliance README | No IRAP system owner for agency boundary |
| ISM-1410 | Authentication hardening | Needs review | Passkeys, Twilio 2FA docs | MFA not enforced for all privileged users |
| ISM-1504 | Access control / PAM | Needs review | RBAC, permissions | Privileged access reviews not operational |
| ISM-1405 | Event logging | Implemented | AuditEvent service | No central SIEM; retention not enforced |
| ISM-0457 | Cryptography | Needs review | `lib/crypto/ndis.ts` | Production key enforcement |
| ISM-1657 | Patching / vulnerabilities | Gap open | package.json | No CI SAST/dependency scanning |
| ISM-1635 | Supply chain / outsourced IT | Needs review | Subprocessor register | Incomplete vendor assessments |
| ISM-0123 | Incident response | Needs review | DR exercises, product incidents | Security IR plan separate from safety |
| ISM-1511 | Business continuity | Needs review | Neon PITR, DR models | RTO/RPO not tested |
| ISM-1546 | Data spillage / privacy | Implemented | Export policy, consent | Erasure not fully operational |
| ISM-1685 | Essential Eight (app control) | Gap open | — | No E8 maturity assessment |
| ISM-1905 | Classification boundary | Not started | — | Requires agency classification |

---

## IRAP deliverables checklist

| Deliverable | Description | MapAble starting point |
|-------------|-------------|------------------------|
| **SSP** | System Security Plan | Architecture docs + this mapping |
| **SAR** | Security Assessment Report | Produced by IRAP assessor |
| **POA&M** | Plan of Action & Milestones | Track gaps from this matrix |
| **Hardening guide** | Implementation evidence | Semgrep + manual audit remediation |
| **ATO recommendation** | Agency decision | Out of MapAble scope |

---

## Essential Eight (SaaS delivery model)

For a cloud-hosted SaaS product, E8 applies differently than on desktop fleets:

| E8 strategy | MapAble relevance | Maturity (est.) |
|-------------|-------------------|-----------------|
| Application control | Vercel-managed runtime | Inherited |
| Patch applications | Dependency updates | ML1 — manual |
| Configure MS Office macros | N/A (web app) | N/A |
| User application hardening | Browser-side | Customer responsibility |
| Restrict admin privileges | RBAC + admin guards | ML2 — partial |
| Patch operating systems | Vercel/Neon | Inherited |
| MFA | Passkeys / 2FA optional | ML1 — not enforced |
| Regular backups | Neon PITR | ML2 — partial |

Document E8 maturity explicitly in SSP when pursuing IRAP.

---

## Shared remediation with SOC 2

Controls that satisfy **both** tracks with one fix:

| Remediation | SOC 2 | ISM |
|-------------|-------|-----|
| Close API auth/IDOR gaps | CC6.1 | ISM-1410, ISM-1504 |
| Production encryption keys | CC6.7 | ISM-0457 |
| Semgrep CI + dependency audit | CC7.1 | ISM-1657 |
| Subprocessor assessments | CC9.1 | ISM-1635 |
| Security IR + NDB procedure | CC7.3 | ISM-0123 |
| Operational retention/deletion | P4.1 | ISM-1546 |

See [crosswalk.md](./crosswalk.md).

---

## Next actions (IRAP track)

1. Confirm whether a **government agency sponsor** exists  
2. Obtain **classification** decision from agency  
3. Draft **SSP** from architecture + subprocessor register  
4. Close shared gaps (auth, crypto, CI, retention)  
5. Engage **accredited IRAP assessor** through agency procurement  
