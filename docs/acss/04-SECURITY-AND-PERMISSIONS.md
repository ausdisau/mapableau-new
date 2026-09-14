# MapAble ACSS — Security and Permissions

**Phase:** 0 — Repository Discovery  
**Doctrine:** Zero trust — authenticate → authorise → consent → policy → execute. Fail closed.

---

## 1. Authentication

| Item | Reality |
|------|---------|
| Primary | **NextAuth.js v4** (`next-auth`) |
| Route | [`app/api/auth/[...nextauth]/`](../../app/api/auth/[...nextauth]/) |
| Options | `authOptions.ts` — **JWT session strategy**, ~30 day max age |
| Credentials | Email/password (`bcryptjs`) |
| Passkeys | WebAuthn (`lib/auth/passkeys.ts`) |
| Step-up / 2FA | Twilio Verify + two-factor tokens |
| OAuth (env-gated) | Auth0, Google, Azure AD, Facebook, Apple (`lib/auth/oauth-providers.ts`) |
| Client session | `SessionProvider` in `components/providers.tsx` |
| Edge gate | `middleware.ts` via `getToken` |

Additional bridges (not primary SoT):

- Keycloak bridge (`KEYCLOAK_ENABLED`) — `lib/auth/keycloak/**`
- Mobile token exchange — `lib/mobile/auth-exchange.ts`
- Auth session ledger — `AuthSessionRecord` + `/api/auth/sessions`

**Not used:** Clerk.

Server user hydration: [`lib/auth/current-user.ts`](../../lib/auth/current-user.ts) loads roles from DB (`primaryRole` + `UserRoleAssignment`).

---

## 2. Authorisation (RBAC)

| Module | Role |
|--------|------|
| [`lib/auth/roles.ts`](../../lib/auth/roles.ts) | Role helpers |
| [`lib/auth/permissions.ts`](../../lib/auth/permissions.ts) | `ROLE_PERMISSIONS` matrix + `hasPermission()` |
| [`lib/auth/guards.ts`](../../lib/auth/guards.ts) | `requireAuth`, `requireAdmin`, `requirePermission`, … |
| [`lib/auth/withAuthorization.ts`](../../lib/auth/withAuthorization.ts) | API wrapper (roles, permissions, optional MFA / ownership) |

Org and provider membership add scoped roles beyond global `MapAbleUserRole`.

**AI must not** accept participant IDs, roles, permissions, or consent assertions from untrusted client JSON as authority. CareOS docs restate this: build context from session + server records ([`docs/careos/CONSENT_AND_AUTHORITY.md`](../careos/CONSENT_AND_AUTHORITY.md)).

---

## 3. Consent

| Module | Role |
|--------|------|
| `lib/consent/consent-service.ts` | Core consent |
| `lib/consent/micro-consent-service.ts` | Fine-grained / micro prompts |
| `lib/consent/consent-receipt-service.ts` | Receipts |
| `lib/consent/require-consent.ts` | Enforcement helper |
| `lib/consent/scope-map.ts` | Scope mapping |
| `lib/ai/navigator/consent-gate.ts` | Navigator pilot gate |
| `intelligence/consent/session-consent.ts` | Session consent |
| UI | Consent wallet components |

Prisma: `ConsentRecord`, `ConsentReceipt`.

**ACSS requirement:** Explicit, scoped, time-aware, revocable, auditable grants — including deny lists for external actions (email, provider contact, appointments, financial transactions). Enforcement must be infrastructural (guardian + action kernel), not prompt-only.

---

## 4. AI authority and policy enforcement

| Control | Location |
|---------|----------|
| Authority ceilings | [`lib/ai/platform/types/authority.ts`](../../lib/ai/platform/types/authority.ts) |
| Prohibited autonomous actions | Same file (`PROHIBITED_AUTONOMOUS_ACTIONS`) |
| Agent manifests | Ceiling + prohibitedActions + requiredConsentScopes + human review |
| Kill switches | `lib/ai/platform/policies/kill-switches.ts` |
| Safeguarding gate | `lib/ai/platform/policies/safeguarding-gate.ts` |
| Unified Guardian | `lib/ai/platform/guardian/**` |
| Human review contracts | `lib/ai/platform/human-review/` |
| Action policy / executor | `lib/ai/platform/actions/policy.ts`, `executor.ts` |
| Connector gateway | Policy, credentials opacity, injection quarantine, circuit breaker |

**Most restrictive rule wins** — aligns with ACSS autonomy pipeline (agent limit ∩ user consent ∩ policy ∩ risk ∩ human approval).

Authority ceilings (existing):

```text
READ_ONLY_EXPLAIN
DRAFT_ONLY
SUGGEST_WITH_HUMAN_REVIEW
SUGGEST_WITH_PARTICIPANT_APPROVAL
DETERMINISTIC_EXECUTE_VIA_SERVICE
NO_OPERATIONAL_AUTHORITY
```

Docs: [`AUTHORITY_MODEL.md`](../ai-platform/AUTHORITY_MODEL.md), [`UNIFIED_GUARDIAN.md`](../ai-platform/UNIFIED_GUARDIAN.md).

Guardian flags default **off** — not a production compliance claim.

---

## 5. Zero-trust request path (target vs today)

Target ACSS path:

```text
AUTHENTICATED → AUTHORISED → CONSENT VALIDATED → POLICY CHECKED → EXECUTED
```

Today’s building blocks:

1. Middleware / `getServerSession` / `withAuthorization` — authentication + RBAC  
2. Consent services / navigator consent gate — partial, domain-specific  
3. Guardian + action policy — flag-gated composition  
4. Deterministic executors — when action kernel enabled  

**Gap:** Single composed Policy Governor facade emitting a durable `GovernanceDecision` for every consequential action.

---

## 6. Tenant isolation and data access

- Server-derived tenant/org context — do not trust client-supplied tenant IDs without membership checks.
- `assertTenantAccess` patterns in multi-tenant admin services.
- Document access grants (`DocumentAccessGrant`).
- Break-glass sessions audited.
- No default Prisma RLS — app services must enforce isolation.

Cross-participant access must fail closed in adversarial tests (Phase security suite).

---

## 7. Secrets and encryption

From `.env.example` themes:

- `NEXTAUTH_SECRET` (session)
- Separate encryption keys (must not reuse NextAuth secret)
- AI gateway / provider keys server-only
- Twilio, SendGrid, Stripe, OAuth client secrets

Never expose API keys, unrestricted participant data, or privileged agent tools to the client.

---

## 8. Audit logging

| Mechanism | Path |
|-----------|------|
| Central audit | [`lib/audit/audit-event-service.ts`](../../lib/audit/audit-event-service.ts) → `AuditEvent` |
| Admin API | `app/api/admin/audit-events` |
| Guardian audit | `lib/ai/platform/guardian/audit.ts` |
| Connector audit | `lib/ai/platform/connector-gateway/audit.ts` |
| Chat guardrails | `server/chat-guardrails.ts` |
| Temporal workflow audit | `lib/workflows/temporal/workflow-audit-service.ts` |
| CareOS audit | `lib/intelligence/careos/audit/` |

ACSS audit ledger fields (who/what/when/why/agent/model/tool/consent/policy/risk/approval/outcome) should converge onto `AuditEvent` (+ linked records), not a silent parallel log.

---

## 9. Security testing posture

Existing: `.github/workflows/security.yml`, Semgrep, CodeQL, production-claims CI, AI platform evaluation suites under `tests/ai-platform/` (referenced by agent manifests).

**ACSS adversarial tests to add (later phases):**

| Attack | Expected |
|--------|----------|
| Bypass consent | Deny / fail closed |
| Exceed agent autonomy / authority ceiling | Deny |
| Invoke prohibited tools | Deny |
| Cross-participant data access | Deny |
| Bypass Policy Governor / guardian | Deny (or impossible if all paths composed) |

Prompt-only restrictions are insufficient.

---

## 10. Accessibility as safety

MapAble is a disability platform. Inaccessible AI approval UIs are a safety defect: participants must be able to understand and refuse actions. New ACSS surfaces must ship with keyboard support, semantics, clear language, and accessible error/approval states (see AI platform [`ACCESSIBILITY.md`](../ai-platform/ACCESSIBILITY.md)).

---

## Related docs

- [SECURITY.md](../../SECURITY.md)
- [`docs/cloud-security-model.md`](../cloud-security-model.md)
- [`docs/ai-platform/THREAT_MODEL.md`](../ai-platform/THREAT_MODEL.md)
- [`docs/ai-platform/guardian/THREAT_MODEL.md`](../ai-platform/guardian/THREAT_MODEL.md)
