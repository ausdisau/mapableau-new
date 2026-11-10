# MapAble ACSS — Data Architecture

**Phase:** 0 — Repository Discovery  
**System of record:** PostgreSQL via Prisma (Neon-oriented deployment).

---

## 1. Database provider

| Item | Reality |
|------|---------|
| Engine | **PostgreSQL** |
| ORM | **Prisma 6.19.2** (`@prisma/client`, `prisma`) |
| Schema | [`prisma/schema.prisma`](../../prisma/schema.prisma) (~16k lines, hundreds of models) |
| Migrations | [`prisma/migrations/`](../../prisma/migrations/) |
| Client | [`lib/prisma.ts`](../../lib/prisma.ts) |
| Hosting docs | [`docs/operations/neon.md`](../operations/neon.md) |
| Env | `DATABASE_URL` (+ `DIRECT_URL` for Neon non-pooler / migrations) |

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Supabase:** optional (`@supabase/supabase-js`) for storage/realtime/outlet Data API — **not** the primary app database or auth SoT.

**Drizzle:** Replit / amalgamation side paths only — not the main MapAble ORM.

---

## 2. Tenancy

| Layer | Models / services | Notes |
|-------|-------------------|-------|
| Primary org tenancy | `Organisation`, `OrganisationMember` | Declared SoT for organisations (see domain ownership docs) |
| Multi-tenant admin (flagged) | `Tenant`, `TenantMembership`, enterprise/government workspaces | `lib/platform/multi-tenant-admin/*`; Phase 7 style flags |
| Provider roles | `Provider`, `ProviderUserRole`, `ProviderRole` | Provider-scoped RBAC |

Access control for Prisma data is **application-layer** (guards, permissions, consent). Postgres RLS is **not** the default Prisma path; see [`lib/db/rls-policy-notes.ts`](../../lib/db/rls-policy-notes.ts). Limited Supabase RLS exists for public provider outlets.

---

## 3. Identity and access models (selected)

| Model | Purpose |
|-------|---------|
| `User` | Account; `primaryRole`, password hash, … |
| `UserRoleAssignment` | Multi-role assignments |
| `Session` | Prisma session table (NextAuth uses **JWT** strategy — adapter not wired as primary) |
| `PasskeyCredential` | WebAuthn |
| `AuthSessionRecord` | Parallel session ledger / revoke |
| `ConsentRecord` | Consent grants |
| `ConsentReceipt` | Receipt / audit of consent |
| `AuditEvent` | Central audit events |
| `BreakGlassAccessSession` | Emergency access pattern |

Roles enum (`MapAbleUserRole`) includes: `participant`, `family_member`, `support_coordinator`, `support_worker`, `provider_admin`, `transport_operator`, `driver`, `employer`, `plan_manager`, `ambassador`, `mapable_admin`.

---

## 4. ACSS-relevant models already present

| ACSS concept | Existing Prisma / store | Gap |
|--------------|-------------------------|-----|
| participants | `ParticipantProfile`, `User` | — |
| organisations | `Organisation`, members | — |
| users / roles | `User`, `UserRoleAssignment`, org/provider roles | — |
| consents | `ConsentRecord`, `ConsentReceipt` | Granular agent/tool scopes incomplete vs ACSS `ConsentGrant` |
| permissions | App RBAC (`lib/auth/permissions.ts`), not a single permissions table for AI tools | Tool-scoped grants |
| documents / evidence | `Document`, `DocumentVersion`, `DocumentAccessGrant` | — |
| audit | `AuditEvent` + domain-specific audit tables | Unify AI consequential shape |
| agent runs | `AgentRun` | Align with mission/task IDs |
| workflow runs | `WorkflowRun` | Mission durability still often in-memory |
| governance | `GovernanceCharter` + AI platform in-memory decisions | Persist `GovernanceDecision` |
| missions / tasks / approvals | APIs + in-memory stores in `lib/ai/platform/missions|actions|…` | **Durable persistence deferred** (Prompt *A series) |
| model runs / tool calls | Partial via agent ops / guardian audit | Formal ledger fields |
| goals / plans / supports | Domain care/support models exist across schema | ACSS naming layer / links to missions |

**Rule:** Do not create a second database for ACSS. Extend Prisma models when durability is required.

---

## 5. In-memory vs durable (critical honesty)

From [`CURRENT_STATE.md`](../ai-platform/CURRENT_STATE.md):

| Subsystem | Persistence today |
|-----------|-------------------|
| Mission runtime store | In-memory (durable deferred) |
| Action kernel approvals / replay | In-memory (Prompt 02A) |
| Adaptive recovery events | In-memory (Prompt 03A) |
| Context fabric events | In-memory (Prompt 04A) |
| Mission watch | In-memory (Prompt 06A) |
| Connector gateway health/idempotency | In-memory (Prompt 09A) |
| `AgentRun`, `AuditEvent`, `ConsentRecord`, `Document*`, `WorkflowRun` | Postgres |

ACSS Phase roadmap must prioritise **durable SoR for missions, governance decisions, approvals, and agent results** before claiming production readiness.

---

## 6. Document storage vs metadata

| Concern | Location |
|---------|----------|
| Bytes / objects | Code: `DOCUMENT_STORAGE_BACKEND` → local / s3 / supabase (`lib/storage/document-storage-service.ts`). `.env.example` still names `DOCUMENT_STORAGE_MODE` (docs/env drift) |
| Metadata / ACL | Prisma `Document*` |
| Secure upload path | `lib/platform/secure-document-service.ts` (malware scan + object put + DB) |
| APIs | `app/api/documents/`, `app/api/v1/documents/` |

Do not log sensitive document contents. Vercel Blob is not wired; optional future backend only.

---

## 7. Embeddings / knowledge store

| Item | Status |
|------|--------|
| Embedding types | `lib/ai/platform/embeddings/types.ts` — contracts |
| Live vector DB | **Missing** |
| Hybrid retrieval | `lib/ai/platform/retrieval/` + mission evidence graph (flag-gated) |
| Context fabric provenance | Implemented when flag on; durability deferred |

ACSS Knowledge Service should authorise → retrieve → return provenance; do not let agents open arbitrary vector indexes.

---

## 8. Migrations and seeds

| Item | Path |
|------|------|
| Migrations | `prisma/migrations/` |
| Seeds | `prisma/seed*.ts` |
| CI | `ci:migration-order`, `ci:migration-integrity`, `.github/workflows/migrations.yml` |

Any ACSS schema additions must go through Prisma migrations and existing CI gates.

---

## 9. Recommended ACSS SoR additions (post-review)

Only after Phase 0 approval; illustrative — final shapes in Phase 1–4 ADRs:

- Durable mission / task / agent_result tables (or promote existing in-memory stores)
- Governance decision records linked to `AuditEvent`
- Consent grants with agentId + permission scopes + expiry/revocation (extend `ConsentRecord` or related)
- Approval requests bound to action proposals
- Model/tool call telemetry linked to agent runs

Avoid duplicating `User` / `Organisation` / `Document`.

---

## Related docs

- [04-SECURITY-AND-PERMISSIONS.md](./04-SECURITY-AND-PERMISSIONS.md)
- [05-ACSS-GAP-MATRIX.md](./05-ACSS-GAP-MATRIX.md)
- [`docs/ai-platform/DATA_CLASSIFICATION.md`](../ai-platform/DATA_CLASSIFICATION.md)
