# MapAble Privacy Review — Analytics & Telemetry

> PostHog, Google Analytics, and product analytics privacy controls (Phase 9).

---

## 1. Analytics Inventory

| System | Type | Location | Default |
|--------|------|----------|---------|
| **PostHog (server)** | LLM telemetry (`$ai_generation`) | `lib/analytics/llm-analytics.ts` | Off without `POSTHOG_API_KEY` |
| **Product analytics (client)** | Custom `window` events | `lib/analytics/product-analytics.ts` | Off unless `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true` |
| **Google Analytics 4** | Client gtag | `components/analytics/GoogleAnalytics.tsx` | Production unless disabled |
| **Vercel Analytics** | Platform | CSP allowlist | Platform-managed |
| **Metabase embeds** | Admin research | `lib/analytics/metabase/*` | Flag-gated |
| **Admin analytics** | Internal dashboards | `lib/analytics/admin-analytics-service.ts` | Admin RBAC |

**No `posthog-js` browser SDK** in repository.

---

## 2. Prohibited Capture (MUST NOT)

Never send to analytics pipelines:

- Passwords or password hashes
- Medical notes, clinical assessments, diagnosis text
- Participant support plans (full text)
- NDIS numbers, identity documents
- Authentication tokens, session IDs, API keys
- Raw payment card numbers or CVV
- Unredacted communication passports

---

## 3. Required Masking

| Surface | Control |
|---------|---------|
| Forms with health/financial fields | Exclude from auto-capture; mask field names in any custom events |
| File uploads | Never attach file contents to events |
| Payment flows (Stripe) | Stripe Elements — no PAN in analytics |
| LLM prompts/responses | Use `redactSensitiveText()` before PostHog capture |
| Audit metadata | `createAuditEvent` strips keys matching `/ndis|password|secret/i` |

---

## 4. Session Replay

- **No PostHog session replay** configured in codebase
- If enabled in PostHog dashboard: **disable for** `/login`, `/register`, `/my/*`, `/care/*`, `/billing/*`, admin routes
- Respect participant consent settings when `MAPABLE_ANALYTICS_CLOUD_ENABLED` research paths are active

---

## 5. Consent & Governance

| Mechanism | Path |
|-----------|------|
| Research governance notice | `components/analytics/ResearchGovernanceNotice.tsx` |
| Privacy notice | `components/analytics/AnalyticsPrivacyNotice.tsx` |
| Access policy | `lib/analytics/analytics-access-policy.ts` |
| Export controls | `lib/platform/privacy/exports/analytics-export-service.ts` |
| Data view policy | `lib/governance/data/analytics-view-policy.ts` |

---

## 6. PostHog Configuration Checklist

- [ ] `POSTHOG_API_KEY` server-only (never `NEXT_PUBLIC_*`)
- [ ] LLM events use property allowlist (model, latency, token counts — not prompt body)
- [ ] Disable person profiling for participant-facing events
- [ ] Data residency: confirm `POSTHOG_HOST` region (AU preference if available)
- [ ] Retention limits configured in PostHog project settings

---

## 7. Google Analytics

- Measurement ID: `G-3H6VVSQJ0C` (`lib/analytics/ga-config.ts`)
- Disable in non-prod: `NEXT_PUBLIC_GA_ENABLED=false`
- CSP allows GA domains in `lib/security/headers.ts`
- Do not send user IDs or NDIS identifiers in custom dimensions

---

## 8. Phase 9 Implementation Tasks

1. Audit all `trackProductEvent()` call sites for PII
2. Add PostHog property scrubber middleware
3. Document opt-out flag wiring to participant preferences
4. Add Vitest: LLM analytics never contains `password`, `ndis`, `token` substrings
5. Admin runbook: disable analytics in incident response

---

## 9. Incident Response

If PII detected in analytics pipeline:

1. Stop ingestion (revoke PostHog key / disable flags)
2. Delete affected events in PostHog (per retention policy)
3. Log incident in audit system
4. Notify privacy officer per organisation policy
