# SOC 2 Trust Services Criteria mapping

**Organisation:** Australian Disability Ltd (MapAble)  
**Scope (proposed):** Security (required) + Confidentiality + Privacy + Availability  
**Type I target:** Design assessment at a point in time  
**Type II target:** 6–12 month operating effectiveness observation  

Machine-readable source: `lib/compliance-evidence/audit-control-catalog.ts` (`SOC2_CONTROLS`).

---

## Scope statement

| In scope | Out of scope (initial) |
|----------|------------------------|
| MapAble web application (Next.js on Vercel) | On-premise customer systems |
| Neon PostgreSQL (participant, care, NDIS data) | End-user device management |
| Auth (NextAuth, passkeys, Twilio 2FA) | Physical data centres (inherited from vendors) |
| API routes under `app/api/` | Customer-configured third-party integrations beyond documented subprocessors |
| Audit, consent, incident, billing subsystems | |

**Subprocessors:** See [subprocessor-register.md](./subprocessor-register.md).

---

## Control matrix

Status legend: **Implemented** | **Needs review** | **Gap open** | **Not started**

### CC1 — Control environment

| ID | Control | Status | Evidence | Gaps |
|----|---------|--------|----------|------|
| CC1.1 | Integrity and ethical values | Needs review | Policy (TBD) | Information security policy not published |

### CC6 — Logical and physical access

| ID | Control | Status | Evidence | Gaps |
|----|---------|--------|----------|------|
| CC6.1 | Authentication on APIs and admin | Needs review | `lib/api/auth-handler.ts`, `middleware.ts` | Unauthenticated ledger/ask/PRMS; IDOR on shifts/bookings/incidents |
| CC6.2 | Registration / deprovisioning | Implemented | User/org models, admin routes | Offboarding runbook not documented |
| CC6.3 | RBAC | Implemented | `lib/auth/permissions.ts` | Privileged access review not scheduled |
| CC6.6 | System boundaries | Needs review | Architecture (TBD) | No boundary diagram in repo |
| CC6.7 | Encryption | Needs review | `lib/crypto/ndis.ts` | Dev key fallback; limited field encryption |

### CC7 — System operations

| ID | Control | Status | Evidence | Gaps |
|----|---------|--------|----------|------|
| CC7.1 | Vulnerability management | Gap open | Semgrep (local only) | No CI SAST/SCA; no pen test artifact |
| CC7.2 | Logging | Implemented | `lib/audit/audit-event-service.ts` | No SIEM/alerting |
| CC7.3 | Incident response | Needs review | `lib/incidents/`, safety docs | Security IR plan; NDB procedure |

### CC8 — Change management

| ID | Control | Status | Evidence | Gaps |
|----|---------|--------|----------|------|
| CC8.1 | Authorised changes | Needs review | Git, Vercel deploys | `ChangeManagementRecord` not linked to releases |

### CC9 — Vendor management

| ID | Control | Status | Evidence | Gaps |
|----|---------|--------|----------|------|
| CC9.1 | Subprocessor risk | Needs review | Subprocessor register | Vendor SOC 2 reports not collected |

### Privacy (P)

| ID | Control | Status | Evidence | Gaps |
|----|---------|--------|----------|------|
| P3.1 | Consent and collection | Implemented | `lib/consent/*`, audit events | RoPA not documented |
| P4.1 | Retention and disposal | Gap open | Retention dry-run only | No executed deletion jobs |

### Availability (A)

| ID | Control | Status | Evidence | Gaps |
|----|---------|--------|----------|------|
| A1.1 | Recovery | Needs review | DR models, Neon docs | RTO/RPO not measured |

---

## Type I vs Type II evidence

| Type I (design) | Type II (operating effectiveness) |
|-----------------|-----------------------------------|
| Policy documents approved | Quarterly access reviews completed |
| Architecture and data flow diagrams | 6–12 months of Semgrep/SCA reports |
| RBAC matrix export | Sample of joiner/leaver tickets |
| Code walkthrough of auth/audit | DR exercise with outcomes |
| Subprocessor register | Incident/table-top exercise records |
| Control owner assignments | Change log linked to deployments |

---

## Auditor walkthrough order

1. **CC6.1** — Demo login, denied access, audit event created  
2. **CC7.2** — Export `GET /api/admin/audit-events` sample (redaction)  
3. **P3.1** — Consent grant → share blocked without consent  
4. **CC6.7** — NDIS encrypt/decrypt; production env var policy  
5. **CC9.1** — Subprocessor register + Neon/Vercel inherited controls  

---

## Related IRAP controls

See [crosswalk.md](./crosswalk.md) for SOC 2 ↔ ISM mapping.

---

## Next actions (SOC 2 track)

1. Close CC6.1 gaps (Phase 0–1 security remediation)  
2. Publish policy pack v1 under `docs/compliance/policies/`  
3. Enable Semgrep in CI (CC7.1)  
4. Operationalize retention (P4.1)  
5. Engage SOC 2 CPA firm for scoping and Type I timeline  
