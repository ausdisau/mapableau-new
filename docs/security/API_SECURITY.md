# MapAble API Security

> Endpoint security matrix and hardening checklist for `app/api/*`.

---

## 1. Scope

- **747** App Router handlers under `app/api/`
- Legacy **20** routes under `ports/mapableau-new/src/app/api/`
- Authorization is **decentralized** — each route must opt into shared helpers

---

## 2. Authentication Patterns

| Pattern | Helper | Typical routes |
|---------|--------|----------------|
| Session required | `requireApiSession()` | Participant, provider, care, billing |
| Permission | `requireApiPermission(p)` | Feature-scoped mutations |
| Admin | `requireApiAdmin()` / `requireApiAdminScope(p)` | `/api/admin/*` via `adminRoutes.ts` |
| HOC wrapper | `withAuthorization({ roles, permissions, requireMfa })` | PRMS, break-glass, developer keys |
| Billing | `requireAnyBillingPermission()` | `/api/billing/*` |
| Partner v1 | `withV1Auth({ scopes })` | `/api/v1/*` |
| Mobile Bearer | `requireMobileAccessToken()` | `/api/mobile/*` |
| Webhook | Signature / secret | Stripe, n8n, cron ingest |
| Public | None (intentional) | Health, register, search, passkeys |

---

## 3. Endpoint Categories

### 3.1 Public (intentional)

| Prefix | Controls | Risk |
|--------|----------|------|
| `/api/health/*` | None | Low — no PII |
| `/api/auth/*` | NextAuth CSRF; partial rate limits | Credential attacks |
| `/api/passkeys/*` | Rate limits on some paths | Enumeration |
| `/api/register` | IP rate limit | Spam |
| `/api/search/*` | IP rate limit | Scraping |
| `/api/contact` | Rate limit | Spam |
| `/api/abn/lookup` | **None** | SSRF/abuse — **remediate** |

### 3.2 Webhooks & automation

| Route | Auth mechanism |
|-------|----------------|
| `/api/stripe/webhooks` | Stripe signature |
| `/api/admin/automation/n8n/webhook` | Shared secret |
| `/api/admin/ingest/ndis-providers` | Cron secret / admin |

### 3.3 Authenticated mutations (high value)

| Prefix | Required checks |
|--------|-----------------|
| `/api/participant/*` | Session + participant ownership |
| `/api/care/*` | Session + authority / org scope |
| `/api/billing/*` | Session + billing permissions |
| `/api/transport/*` | Session + role |
| `/api/admin/*` | Admin scope |

### 3.4 AI & intelligence

| Prefix | Auth | Additional |
|--------|------|------------|
| `/api/ai/*` | Session (most) | Capability flags, kill switches |
| `/api/agent/*` | Partial | Rate limits; **audit unauthenticated paths** |
| `/api/intelligence/*` | Session + flags | Raw SQL in services — parameterize |
| `/api/navigator/pilot/*` | Session + pilot flags | Relational governance gates |

### 3.5 Partner API

| Prefix | Auth |
|--------|------|
| `/api/v1/*` | API key + scope + optional participant authority gate |

---

## 4. OWASP API Top 10 Mapping

| Risk | MapAble status | Action |
|------|----------------|--------|
| **Broken Object Level Authorization** | Partial — handler-dependent | IDOR test suite (Phase 15) |
| **Broken Authentication** | Strong web; weak mobile when enabled | Phase 3, 10 |
| **Broken Object Property Level Authorization** | Unknown coverage | Audit PATCH handlers |
| **Unrestricted Resource Consumption** | In-memory limits only | Distributed rate limit (Phase 11) |
| **Broken Function Level Authorization** | RBAC matrix exists | Consolidate `withAuthorization` |
| **Unrestricted Access to Sensitive Business Flows** | Feature flags | Keep fail-closed defaults |
| **SSRF** | AI tools, ABN lookup | Allowlist outbound URLs |
| **Security Misconfiguration** | CSP report-only | Phase 12 enforce |
| **Improper Inventory Management** | This document | Keep updated per sprint |
| **Unsafe Consumption of APIs** | Stripe verified | Audit all webhook routes |

---

## 5. Control Checklist (per new route)

Every new `app/api/**/route.ts` MUST:

- [ ] Call `requireApiSession()` or documented public exception
- [ ] Verify resource ownership or org scope before reads/writes
- [ ] Use Zod (or equivalent) for input validation
- [ ] Avoid raw SQL; use Prisma parameterized queries
- [ ] Log mutations via `createAuditEvent`
- [ ] Apply rate limiting for public or expensive endpoints
- [ ] Never return stack traces in production
- [ ] Reject oversize bodies (Next.js / route limits)

---

## 6. Known Gaps (audit findings)

| Route / area | Issue | Priority |
|--------------|-------|----------|
| `/api/abn/lookup` | No auth, no rate limit | P2 |
| `/api/access-intelligence-next/queries/execute` | Flag gate only | P2 |
| `/api/debug/agent-log` | Open in non-prod | P3 |
| `/api/agent/disability-services` | Rate limit only | P2 |
| ~700 routes | No rate limiting | P1 (distributed) |
| Cookie-auth POST/PUT/DELETE | No CSRF token | P2 |

---

## 7. CI Enforcement

| Script | Purpose |
|--------|---------|
| `scripts/ci/check-route-auth-smoke.ts` | Known sensitive routes must import auth |
| `scripts/ci/check-public-api-exposure.ts` | Documents public surface |
| `scripts/ci/check-file-upload-validation.ts` | Upload handlers validated |
| `tests/security/*` | Vitest security regression |

---

## 8. Rate Limiting Policy

See `docs/operations/RATE_LIMITING.md`.

**Current:** `lib/api/ip-rate-limit.ts` — process-local `Map`.  
**Target:** Upstash Redis or Vercel Firewall rate rules for production.

Sensitive pilot mutations remain **blocked** until distributed store is wired.

---

## 9. File Upload Security

Upload handlers must validate:

- MIME type vs extension
- Max size
- Virus scan hook (where enabled)
- Storage path traversal prevention

CI gate: `check-file-upload-validation.ts`.

---

## 10. Recommended PR Sequence (API)

1. **PR — Rate limiting:** Redis-backed limiter + apply to auth/search/agent routes
2. **PR — IDOR tests:** Playwright/Vitest for participant/care/billing ownership
3. **PR — CSRF:** Origin check middleware for cookie-authenticated mutations
4. **PR — Public surface reduction:** `/api/abn/lookup`, debug routes
