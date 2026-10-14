# MapAble Threat Model

> Companion to `SECURITY_BASELINE.md` — STRIDE-oriented analysis for the MapAble platform.

---

## 1. System Context

**Primary assets:**

- Participant PII and NDIS-related data (`ParticipantProfile`, support plans)
- Provider organisation data and verification records
- Billing, claims, and payment metadata
- AI conversation context and mission plans
- Authentication credentials and session tokens
- Audit and governance records

**Primary actors:**

| Actor | Trust level |
|-------|-------------|
| Participant (web/mobile) | Authenticated user |
| Support coordinator / carer (delegated) | Authenticated + authority grant |
| Provider staff | Organisation-scoped |
| MapAble admin | Elevated RBAC |
| Partner integrator | API key + scopes |
| Anonymous visitor | Untrusted |
| External LLM provider | Semi-trusted processor |
| Attacker | Untrusted |

---

## 2. Data Flow Diagram (simplified)

```
Participant Browser ──HTTPS──▶ Vercel ──▶ Next.js API Route
                              │              │
                              │              ├──▶ requireApiSession / withAuthorization
                              │              ├──▶ Domain Service
                              │              ├──▶ Prisma ──▶ Neon Postgres
                              │              ├──▶ AI Gateway ──▶ Vercel AI / OpenAI
                              │              └──▶ createAuditEvent
                              │
Android App ──Bearer JWT──▶ /api/mobile/* ──▶ requireMobileAccessToken
Partner ──API Key──▶ /api/v1/* ──▶ withV1Auth + participant authority
```

---

## 3. STRIDE Analysis

### Spoofing

| Threat | Target | Current control | Residual risk |
|--------|--------|-----------------|---------------|
| Stolen session cookie | Web user | HttpOnly JWT, HTTPS, MFA step-up | XSS theft |
| Forged mobile Bearer | Mobile API | HMAC-signed tokens | Secret compromise |
| API key leakage | Partner API | Hashed storage, scopes | Key in logs/clients |
| OAuth account linking | OAuth users | Email match + auto-provision | Account pre-hijack |
| Socket userId spoof | Realtime | HMAC handshake | Weak `SOCKETIO_AUTH_SECRET` |

### Tampering

| Threat | Target | Current control | Residual risk |
|--------|--------|-----------------|---------------|
| IDOR mutation | Participant records | Per-route ownership checks | Inconsistent coverage |
| Webhook replay | Stripe/n8n | Signature verification | Missing timestamp tolerance audit |
| AI action execution | Action kernel | Human approval binding | Bypass if flag misconfigured |
| Mission replan without auth | `/api/ai/missions/*` | Session + flags | Flag-off paths |

### Repudiation

| Threat | Target | Current control | Residual risk |
|--------|--------|-----------------|---------------|
| Admin action denial | Admin mutations | `createAuditEvent` | Not all mutations logged |
| AI decision denial | AI platform | Telemetry + audit partial | Incomplete correlation IDs |
| Billing dispute | Invoices/claims | Audit + Stripe records | Gap if audit skipped |

### Information Disclosure

| Threat | Target | Current control | Residual risk |
|--------|--------|-----------------|---------------|
| Cross-participant read | Profile/API | Authority service | Handler bugs |
| LLM training leakage | AI prompts | Redaction helpers | PostHog `$ai_generation` events |
| Error stack traces | API 500s | Production error sanitization | Verbose dev paths |
| Enumeration | Passkey login | Explicit error messages | User discovery |
| Debug endpoints | `/api/debug/*` | 404 in production | Misconfigured env |

### Denial of Service

| Threat | Target | Current control | Residual risk |
|--------|--------|-----------------|---------------|
| API flooding | Public routes | In-memory IP limit (~38 routes) | Multi-instance bypass |
| Expensive AI calls | Agent routes | Kill switches, flags | Default interpreter enabled |
| DB connection exhaustion | Prisma | Pooler URL | Raw query storms |

### Elevation of Privilege

| Threat | Target | Current control | Residual risk |
|--------|--------|-----------------|---------------|
| `mapable_admin` bypass | All permissions | By design | Compromised admin account |
| Role assignment drift | Multi-role users | `primaryRole` vs `roles` inconsistency | Wrong permission path |
| Break-glass abuse | Emergency access | MFA + audit | Policy bypass |
| Feature flag enablement | Disabled capabilities | Env-only flags | Mis-deploy |

---

## 4. Trust Boundaries

| Boundary | Inside | Outside | Enforcement |
|----------|--------|---------|-------------|
| B1 Browser ↔ Origin | Same-origin cookies | Cross-site requests | SameSite, CORS on `/api` |
| B2 Edge ↔ Server | Vercel-managed TLS | Raw HTTP | Platform |
| B3 Server ↔ Database | Prisma queries | Direct SQL clients | Connection string secrecy |
| B4 Server ↔ LLM | Gateway calls | Direct OpenAI | Model registry + kill switches |
| B5 Server ↔ Partner | v1 API | Arbitrary internet | API keys + scopes |
| B6 AI ↔ Database | **Currently direct** | Should be via gateway | **Phase 5 target** |

---

## 5. Priority Threat Scenarios

### T-01: Participant data cross-read (IDOR)

**Attacker:** Authenticated participant A  
**Action:** Guesses UUID of participant B's care plan endpoint  
**Impact:** NDIS-sensitive data disclosure  
**Mitigation:** Ownership checks in every `/api/participant/*`, `/api/care/*` handler; automated IDOR tests (Phase 15)

### T-02: AI tool exfiltrates database rows

**Attacker:** Prompt injection via chat  
**Action:** Tricks agent into querying unrestricted Prisma paths  
**Impact:** Bulk PII exfiltration  
**Mitigation:** AI gateway permission layer; tool allowlists; audit every AI-initiated read (Phase 5)

### T-03: Session fixation / CSRF on mutation API

**Attacker:** Malicious site  
**Action:** Tricks logged-in user browser to POST to MapAble API  
**Impact:** Unintended state change  
**Mitigation:** SameSite cookies (partial); add Origin validation or CSRF tokens for cookie-auth mutations (Phase 3)

### T-04: Rate limit bypass on auth endpoints

**Attacker:** Distributed bots  
**Action:** Password spray on `/api/auth/*`, passkey probe  
**Impact:** Account compromise  
**Mitigation:** Distributed rate limiting (Redis); account lockout policies (Phase 11)

### T-05: Webhook signature bypass

**Attacker:** External  
**Action:** Forged Stripe webhook without valid signature  
**Impact:** Fraudulent subscription state  
**Mitigation:** Stripe signature verification (existing); verify all webhook routes (Phase 11)

---

## 6. Out of Scope (this sprint)

- Physical device theft scenarios (partially covered in Phase 10)
- Supply chain compromise of npm packages (Dependabot + lockfile only)
- Insider threat with production DB credentials
- Nation-state adversaries

---

## 7. Review Cadence

- **Per PR:** Security-focused review for auth, AI, billing, participant routes
- **Quarterly:** Re-run baseline audit; update risk register
- **On incident:** Update threat model within 5 business days
