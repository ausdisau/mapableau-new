# MapAble Security Baseline

> **Status:** Baseline audit — September 2026  
> **Scope:** Canonical MapAble monorepo (`mapableau-new`)  
> **Audience:** Engineering, security review, release governance

This document captures the **as-is** security posture at the start of the production-hardening sprint. It is the authoritative inventory for Phases 1–15 of the security refactoring programme.

---

## 1. Architecture Overview

MapAble is a **Next.js 15 App Router** application at the repository root, backed by **PostgreSQL (Neon)** via **Prisma**, deployed on **Vercel**, with optional **Temporal** workflows, **Socket.IO** realtime, and a native **Android** client (`apps/android`).

```
┌─────────────────────────────────────────────────────────────────┐
│ Clients: Web (Next.js) │ Android (Expo/Kotlin) │ Partner API   │
└────────────┬────────────────────┬────────────────────┬──────────┘
             │                    │                    │
             ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Edge: middleware.ts (session presence, CSP, host rewrites)      │
│ API: ~747 route handlers (per-route auth — no global /api gate) │
└────────────┬────────────────────────────────────────────────────┘
             │
     ┌───────┴───────┬──────────────┬─────────────┐
     ▼               ▼              ▼             ▼
 lib/services   lib/ai/platform  lib/billing  intelligence/
     │               │              │             │
     └───────┬───────┴──────────────┴─────────────┘
             ▼
      lib/prisma.ts → PostgreSQL (Neon)
             │
     ┌───────┴────────┐
     ▼                ▼
 Stripe/Xero      PostHog (server LLM telemetry)
 Twilio 2FA       Vercel AI Gateway
 OAuth providers  Temporal (optional)
```

### Key packages (monorepo)

| Path | Role |
|------|------|
| `app/` | Next.js routes, layouts, marketing, participant dashboards |
| `lib/` | Domain services, auth, AI platform, billing, security |
| `prisma/schema.prisma` | ~750 models — single schema |
| `packages/contracts`, `packages/domain-*` | Shared domain types |
| `apps/android` | Native participant shell |
| `apps/realtime-server` | Socket.IO with HMAC handshake auth |
| `server/` | Legacy Express-style modules (being absorbed) |

### Feature gating

Most capabilities default **fail-closed** via `MAPABLE_*_ENABLED=false` in `.env.example`. Production builds call `assertDeployedProductionEnv()` from `next.config.ts`.

---

## 2. Authentication Flow

| Surface | Mechanism | Entry points |
|---------|-----------|--------------|
| **Web session** | NextAuth JWT (30d maxAge, 24h updateAge) | `app/api/auth/[...nextauth]/` |
| **Email/password** | bcrypt + optional Twilio SMS 2FA | `authOptions.ts`, `twilio-2fa/*` |
| **OAuth** | Auth0, Google, Microsoft, Facebook, Apple | `lib/auth/oauth-providers.ts` |
| **Passkeys** | WebAuthn (@simplewebauthn) | `app/api/passkeys/*`, `lib/auth/passkeys.ts` |
| **Step-up MFA** | Headers + DB challenges | `lib/auth/withAuthorization.ts`, `step-up` route |
| **Mobile** | HMAC JWT access/refresh (feature-flagged off) | `lib/mobile/*`, `/api/mobile/auth/*` |
| **Partner API** | API keys + scopes | `lib/platform/api/v1-handler.ts` |
| **Cron/admin jobs** | `ADMIN_CRON_SECRET` bearer | `lib/admin/cron-auth.ts` |
| **Socket.IO** | HMAC signed handshake | `apps/realtime-server/src/auth/socket-auth.ts` |

**Session secret policy:** `lib/auth/nextauth-env.ts` — fail-closed on Vercel production without `NEXTAUTH_SECRET`.

**Field encryption:** `NDIS_ENCRYPTION_KEY` (separate from session secret); `MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK` must stay `false` in production.

---

## 3. Authorization Model

| Layer | Implementation | Notes |
|-------|----------------|-------|
| **RBAC** | `lib/auth/permissions.ts` — ~200 permissions, 11 roles | `mapable_admin` bypasses all checks |
| **API helpers** | `requireApiSession`, `requireApiPermission`, `requireApiAdmin` | `lib/api/auth-handler.ts` |
| **HOC** | `lib/auth/withAuthorization.ts` | Roles, permissions, MFA, custom hooks |
| **Page guards** | `lib/auth/guards.ts` | Redirect-based; used in layouts |
| **Participant authority** | Consent/delegation grants | `lib/authority/participant-authority-service.ts` |
| **Admin scopes** | `ADMIN_SCOPE_PERMISSIONS` | `server/admin/adminRoutes.ts` |

**Gap:** Edge `middleware.ts` checks **session presence only**, not roles. `/admin/*` is not in middleware prefix list — protected by `app/admin/layout.tsx` only.

**Gap:** Two different `withAuthorization` implementations exist (`lib/auth/` vs `lib/api/`).

---

## 4. API Surface

| Metric | Value |
|--------|-------|
| Route handlers | **747** under `app/api/` |
| Routes with session/admin auth | **~585** |
| Public / webhook / alternate auth | **~160** |
| Rate-limited (in-memory IP) | **~38** |

Top prefixes: `admin/` (126), `billing/` (46), `transport/` (45), `care/` (33), `ai/` (17), `v1/` (15).

See `docs/security/API_SECURITY.md` for endpoint categories and control matrix.

---

## 5. Middleware

**File:** `middleware.ts`

| Responsibility | Detail |
|----------------|--------|
| Auth gate | JWT via `getToken()` + session fetch fallback |
| Protected prefixes | `/dashboard`, `/provider`, `/care/*`, `/transport/*`, etc. |
| CSP | Nonce injection when `MAPABLE_CSP_ENFORCE_PREVIEW` |
| Correlation IDs | Request tracing |
| Host rewrites | Labs, peers subdomains |

**Not covered:** Global `/api/*` authentication, RBAC at edge, CSRF on custom API routes.

---

## 6. Environment Variables

**Primary reference:** `.env.example` (~945 lines)

| Category | Examples | Client exposure |
|----------|----------|-----------------|
| Database | `DATABASE_URL`, `DIRECT_URL` | Never |
| Auth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Never |
| Encryption | `NDIS_ENCRYPTION_KEY` | Never |
| AI | `AI_GATEWAY_API_KEY`, `OPENAI_API_KEY`, kill switches | Never |
| Billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Never |
| Analytics | `POSTHOG_API_KEY` | Never |
| Feature flags | `MAPABLE_*_ENABLED` | Some `NEXT_PUBLIC_*` |
| Mobile | `MAPABLE_MOBILE_TOKEN_SECRET` | Never |
| Grocery (optional) | `WOOLWORTHS_API_KEY`, `WOOLWORTHS_PUBLIC_API_KEY`, `COLES_API_KEY` | Never |

Production validation: `lib/env/assert-deployed-production-env.ts`.

---

## 7. GitHub Actions

| Workflow | Security role |
|----------|---------------|
| `codeql.yml` | SAST — JS/TS, Python, Actions |
| `security.yml` | Semgrep, secret patterns, prod audit, route-auth smoke |
| `semgrep.yml` | Duplicate Semgrep run |
| `ci.yml` | Lint, type-check, `tests/security` |
| `csp-enforce-preview.yml` | Enforcing CSP matrix |
| `production-claims.yml` | Feature claim integrity |
| `dependabot.yml` | Weekly npm + actions updates |

**Scripts:** `scripts/ci/check-secret-patterns.ts`, `check-route-auth-smoke.ts`, `check-public-api-exposure.ts`, `check-unsafe-env-fallbacks.ts`.

**Gap:** No repo-level GitHub Push Protection config (org-level). Branch protection documented in `docs/operations/branch-protection.md`.

---

## 8. Prisma & Database

| Item | Detail |
|------|--------|
| Schema | `prisma/schema.prisma` — 750 models |
| Client | Singleton `lib/prisma.ts` |
| Raw SQL | ~18 files (`$queryRaw` / `$executeRaw`) |
| Participants | `User` + `ParticipantProfile` (no separate Participant model) |
| Tenancy | `Tenant`, `Organisation`, `OrganisationMember` |
| Audit model | `AuditEvent` via `lib/audit/audit-event-service.ts` |

**RLS:** Not enabled. Sprint Phase 6 will prepare policies; enable only after Prisma compatibility review.

---

## 9. AI Integrations

Governed platform under `lib/ai/platform/`:

- Capability registry + kill switches
- Model gateway (`resolveModelForCapability`) — Vercel AI Gateway preferred
- Action kernel (human approval required)
- Connector gateway (credential redaction)
- Context fabric, adaptive recovery

**HTTP entry points:** `/api/ai/*`, `/api/agent/*`, `/api/intelligence/*`, `/api/navigator/pilot/*`, `/api/mapable/ask`.

See `docs/security/AI_SECURITY.md`.

**Current gap:** AI services call Prisma directly in domain handlers — Phase 5 introduces `packages/ai-gateway` permission layer.

---

## 10. Mobile Authentication

| Component | Path |
|-----------|------|
| Token exchange | `lib/mobile/auth-exchange.ts` |
| Bearer validation | `lib/mobile/require-mobile-session.ts` |
| Android client | `apps/android/feature/auth/` |
| Default state | **Disabled** (`MAPABLE_MOBILE_AUTH_ENABLED=false`) |

**Gaps:** No refresh-token rotation list; password-only (no MFA); Google grant returns 501.

---

## 11. Third-Party Services

| Service | Purpose | Auth |
|---------|---------|------|
| Neon | PostgreSQL | Connection string |
| Stripe | Payments | Secret key + webhook signatures |
| Xero | Accounting | OAuth |
| Twilio | SMS 2FA | API credentials |
| Vercel | Hosting, AI Gateway | Platform OIDC / API keys |
| PostHog | Server LLM telemetry | API key |
| Google Analytics | Client analytics | Public measurement ID |
| Temporal | Durable workflows (optional) | mTLS / API key |
| Supabase | Legacy imports only | Service role (server-only) |

---

## 12. Trust Boundaries

```
 [Untrusted Internet]
        │
        ▼
 ┌──────────────┐     ┌─────────────────┐
 │ Vercel Edge  │────▶│ Next.js Server  │
 │ WAF/Firewall │     │ (Node runtime)  │
 └──────────────┘     └────────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         [PostgreSQL]    [Stripe/Xero]    [LLM Gateway]
              │                                 │
              └──────── Trusted VPC ────────────┘

 [Partner API keys] ──▶ Scoped v1 routes ──▶ Domain services
 [Mobile Bearer]   ──▶ Mobile routes     ──▶ Same User table
```

**Trust assumptions:**

- Vercel host header trust (`trustHost: true`) — required for proxy deployment
- SameSite cookies protect browser session mutations (partial CSRF defence)
- Webhook endpoints trust signature verification only

---

## 13. Attack Surface

| Vector | Exposure | Current controls |
|--------|----------|------------------|
| Unauthenticated API abuse | High (747 routes) | Partial IP rate limits; feature flags |
| IDOR on participant data | Medium | Per-handler ownership checks (inconsistent) |
| AI prompt injection → data exfil | Medium | Kill switches, redaction, human review for actions |
| Session hijacking | Medium | HttpOnly JWT cookies, MFA step-up for sensitive ops |
| SSRF via AI tools / webhooks | Low–Medium | Connector gateway; needs audit per tool |
| File upload malware | Medium | `check-file-upload-validation.ts` in CI |
| Dependency supply chain | Medium | Dependabot, CodeQL, Semgrep |
| Secrets in repo | Low (after Phase 2) | CI secret pattern scan |
| XSS | Medium | CSP report-only (not enforcing in prod default) |
| CSRF on API | Medium | No app-level CSRF beyond NextAuth |

---

## 14. Risk Register

| ID | Risk | Severity | Likelihood | Phase | Mitigation |
|----|------|----------|------------|-------|------------|
| R-01 | No global API auth middleware | High | Medium | 4 | Route auth matrix + smoke tests expansion |
| R-02 | In-memory rate limiting | High | High | 11 | Redis/Upstash-backed limiter |
| R-03 | CSP report-only in production | Medium | Medium | 12 | Enforce CSP with nonce path |
| R-04 | AI direct Prisma access | High | Medium | 5 | `packages/ai-gateway` permission layer |
| R-05 | Duplicate withAuthorization | Medium | Low | 3 | Consolidate to single module |
| R-06 | Admin routes outside edge middleware | Medium | Low | 3 | Extend middleware or enforce layout tests |
| R-07 | Hardcoded retailer API keys | Medium | Fixed | 2 | Env-only grocery keys |
| R-08 | Keycloak callback no session | Low | Low | 3 | Complete session bridge |
| R-09 | Mobile auth weak when enabled | Medium | Low | 10 | MFA, rotation, secure storage |
| R-10 | Raw SQL in intelligence layer | Medium | Low | 6 | Parameterize; reduce raw usage |
| R-11 | PostHog may capture sensitive LLM payloads | Medium | Medium | 9 | Redaction + consent gates |
| R-12 | Temporal workflow auth gaps | Medium | Low | 8 | Permission check at workflow start |
| R-13 | `/api/abn/lookup` unauthenticated | Low | Medium | 11 | Rate limit + optional auth |
| R-14 | Passkey login user enumeration | Low | Medium | 3 | Generic error messages |
| R-15 | Vercel MCP/project config drift | Low | Medium | 14 | Output directory + env audit |

---

## 15. Related Documents

| Document | Purpose |
|----------|---------|
| `THREAT_MODEL.md` | STRIDE-oriented threat analysis |
| `API_SECURITY.md` | Endpoint security matrix |
| `AI_SECURITY.md` | AI gateway and governance |
| `TEMPORAL_SECURITY.md` | Workflow hardening |
| `PRIVACY_REVIEW.md` | Analytics and participant data |
| `essential-eight/CONTROL_REGISTER.md` | Essential Eight alignment |

---

## 16. Sprint Definition of Done

A phase is complete when: TypeScript passes, tests pass, a11y tests pass, security tests pass, no new high-severity dependency vulnerabilities, documentation updated, CI passes, and changes reviewed in a focused PR (≤50 files).

**Critical/high findings block phase completion** until remediated and documented.
