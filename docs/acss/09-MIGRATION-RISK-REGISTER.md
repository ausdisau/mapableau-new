# MapAble ACSS — Migration Risk Register

**Phase:** 0 — Forensic audit  
**Severity:** CRITICAL | HIGH | MEDIUM | LOW

| ID | Risk | Likelihood | Impact | Severity | Mitigation | Dependencies | Owner role |
|----|------|------------|--------|----------|------------|--------------|------------|
| R01 | Parallel ACSS rewrite forks AI Platform | Med | Destabilises agents/governance | **CRITICAL** | ADR: evolve `lib/ai/platform`; ban second registry | Phase 0 approval | Principal Architect |
| R02 | In-memory mission/action stores lose state on Vercel isolates | **High** | Broken missions/approvals | **CRITICAL** | Durable Prisma stores before production flags | Missions, actions | AI Systems + Data Architect |
| R03 | Local document filesystem on Vercel | Med | Data loss / missing files | **HIGH** | Force s3/supabase/blob in prod; fail closed on local | Storage env | Data Architect |
| R04 | Temporal worker code without `@temporalio` deps in package.json | Med | False confidence in workflows | **HIGH** | Investigate packaging; use Prisma `WorkflowRun` until proven | WorkflowEngine | Platform Eng |
| R05 | Enabling Guardian/Action flags without full side-effect coverage | Med | Bypass via legacy email/SMS/API paths | **CRITICAL** | Inventory side effects; route high-risk through Action Gateway | Security audit | Security Architect |
| R06 | Consent bypass via client-supplied authority JSON | Med | Unauthorised actions | **CRITICAL** | Server-derived identity/consent only; adversarial tests | Auth + Consent | Security Architect |
| R07 | Cross-participant data access in agent tools | Med | Privacy breach | **CRITICAL** | Tenant checks in every retrieval/tool; fail closed | RBAC, Prisma | Security + Data |
| R08 | Prompt injection → tool abuse | **High** | External actions / exfil | **HIGH** | Connector injection quarantine; tool allowlists; never execute on retrieved-doc instructions | Guardian, connectors | AI Security |
| R09 | Model capability increase expands authority silently | Med | Uncontrolled autonomy | **CRITICAL** | Authority ceilings independent of model; kill switches | Authority model | AI Systems Architect |
| R10 | Auth/session changes during ACSS work | Low | Lockouts | **HIGH** | Do not change NextAuth in early phases | `lib/auth` | Auth owner |
| R11 | Large Prisma migrations for ACSS | Med | Deploy risk / downtime | **HIGH** | Incremental migrations; CI migration gates; expand-contract | `prisma/` | Data Architect |
| R12 | Accessibility regressions in approval UX | Med | Participants cannot refuse | **HIGH** | a11y tests mandatory on ACSS UI | `packages/accessibility` | Accessibility Architect |
| R13 | Production claim honesty violations | Med | Trust / compliance | **HIGH** | Keep `production-claims` CI; flags default off | CURRENT_STATE | Product + Eng |
| R14 | Replit dual-stack AI bypasses gateway | Med | Ungoverned model calls | **MEDIUM** | Do not expand; route or quarantine | `server/chat` | AI Systems |
| R15 | MCP tools exposed to product agents | Low | Privileged operator tools abused | **HIGH** | Keep MCP stdio/dev; hard auth if ever wired | `mcp/` | Security |
| R16 | Cron/watch storms without durable idempotency | Med | Duplicate notifications/actions | **MEDIUM** | Idempotent ticks; in-app only until durable | Mission watch | Platform |
| R17 | Preview env secrets / AI keys leakage | Low | Cost / data | **MEDIUM** | Vercel env segregation; no client keys | Vercel project | Ops |
| R18 | Dependency churn (AI SDK majors) | Med | Break streaming/agents | **MEDIUM** | Pin majors; eval suite | `ai` package | Eng |
| R19 | NDIS/domain incorrect AI advice presented as official | Med | Harm / liability | **HIGH** | Policy agent provenance labels; prohibited definitive legal conclusions | Policy agent | Domain + Legal |
| R20 | Env drift (`DOCUMENT_STORAGE_MODE` vs `BACKEND`) | Med | Misconfigured storage | **MEDIUM** | Align example with code in a later docs/chore PR | `.env.example` | Ops |

## Production downtime posture

- Prefer flag-gated rollout (`MAPABLE_*` defaults false).  
- No big-bang schema cutover.  
- Preview deployments + CI (type-check, lint, tests, security, production-claims) before production.

## Participant data

- Treat all agent context as D2+ unless classified otherwise (`docs/ai-platform/DATA_CLASSIFICATION.md`).  
- Redaction helpers already exist under platform redaction — reuse.
