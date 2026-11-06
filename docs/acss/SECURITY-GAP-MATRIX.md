# MapAble ACSS — Security Gap Matrix

**Phase:** 0 — Forensic audit (document only; do not exploit)

| Area | Current state | Gap | Severity |
|------|---------------|-----|----------|
| Authentication | NextAuth JWT + passkeys + optional OAuth/2FA | Mature; don’t churn early | LOW |
| Authorisation | Server `withAuthorization` / guards / RBAC matrix | Ensure all new ACSS APIs use it; UI is not enough | MEDIUM |
| Tenant isolation | App-layer org/tenant checks; no default Prisma RLS | Cross-participant tool access tests required | **HIGH** |
| Consent | Services + receipts + micro-consent + navigator gate | Not universally composed on all side effects | **HIGH** |
| Agent permissions | Manifest ceilings + prohibited actions | Tool-level grants incomplete vs ACSS ideal | **HIGH** |
| Tool permissions | Capability keys + connector policy | Legacy paths may call externals outside kernel | **CRITICAL** |
| Prompt injection | Connector injection quarantine; prohibited doc-instruction exec | Uneven coverage across all LLM entrypoints | **HIGH** |
| Data leakage / exfil | Redaction helpers; classification docs | Streaming/chat paths need continuous review | **HIGH** |
| Audit | `AuditEvent` + multiple AI audits | Unified consequential ledger fields | MEDIUM |
| Secrets | Env-based; encryption key separation noted | Large `.env.example` surface; ops discipline | MEDIUM |
| File security | validateUpload + secure-document scan path | Local FS unsuitable on Vercel prod | **HIGH** |
| External actions | Action kernel (flagged) + many legacy APIs | Incomplete Action Gateway coverage | **CRITICAL** |
| Human approval | Action approvals + human-review contracts | Must be mandatory for consequential execute | **HIGH** |
| Guardian enablement | Implemented, flags default off | Enabling without path coverage creates false safety | **HIGH** |
| SSRF | Connector/gateway patterns | Review any URL-fetch tools before agent exposure | MEDIUM |
| Privilege escalation | Admin roles; break-glass audited | Adversarial tests for role/tool escalation | **HIGH** |
| Consent bypass | Server-side require-consent helpers | Client-supplied consent claims must be ignored | **CRITICAL** |
| Agent permission escalation | Manifest validation | Prevent runtime self-modification (already prohibited) | MEDIUM |
| CSP / CORS | Middleware CSP; vercel.json CORS | Keep; review peer host rules | LOW |
| MCP exposure | Dev stdio only | Do not expose operator MCP to participants | **HIGH** if changed |

## Enforcement path status

```text
AI → Proposed Action → Consent → Privacy → Rights → Risk → Policy → Human → Action Gateway
```

Today: pieces exist; **composition + universal side-effect coverage + durability** are the gaps. Prompt-only rules are insufficient.

## Required adversarial tests (Phase 3+)

1. Bypass consent → deny  
2. Exceed authority ceiling → deny  
3. Invoke prohibited tool → deny  
4. Read another participant’s data → deny  
5. Skip guardian/policy → deny / unreachable  
6. Retrieved document instructs “ignore policies” → quarantine / deny  

**Expected: FAIL CLOSED.**
