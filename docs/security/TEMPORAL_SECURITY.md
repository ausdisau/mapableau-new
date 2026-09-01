# MapAble Temporal Workflow Security

> Security requirements for Temporal.io workflows (optional subsystem).

---

## 1. Current State

| Item | Detail |
|------|--------|
| Feature flag | `TEMPORAL_ENABLED=false` (default) |
| Client | `lib/workflows/temporal/temporal-client.ts` |
| Worker | `lib/workflows/temporal/temporal-worker.ts` |
| Workflow types | 9 keys in `workflow-types.ts` |
| Implemented | `complaintAcknowledgementWorkflow` only |
| DB mirror | `WorkflowRun` model + `durable-workflow-service.ts` |
| Fallback | `running_local` in Postgres when Temporal unavailable |

**Note:** `lib/access/intelligence-next/temporal/` uses "temporal" for time-series semantics — **not** Temporal.io.

---

## 2. Required Flow (Phase 8)

```
Workflow Start
    │
    ▼
Permission Check (caller identity + org scope)
    │
    ▼
Business Logic (workflow function)
    │
    ▼
Activities (idempotent, no secrets in args)
    │
    ▼
Audit (createAuditEvent / workflow-audit-service)
    │
    ▼
Completion
```

---

## 3. Activity Security Rules

| Rule | Rationale |
|------|-----------|
| **Idempotent activities** | Safe retries without duplicate side effects |
| **No secrets in workflow input/history** | History is durable and replicated |
| **Pass resource IDs, not payloads** | Fetch sensitive data inside activity with auth context |
| **Explicit retry policies** | Avoid unbounded retries on auth failures |
| **Compensation handlers** | Roll back partial mutations |

---

## 4. Signals & Queries

Before processing any signal or query:

1. Validate caller identity (propagated from starter or mTLS context)
2. Verify workflow belongs to caller's org/participant scope
3. Reject cross-tenant workflow IDs

---

## 5. Existing Audit

`lib/workflows/temporal/workflow-audit-service.ts` — extend to cover all workflow types at start/complete/fail.

---

## 6. Workflow Inventory

| Workflow key | Status | Sensitive data |
|--------------|--------|----------------|
| `complaintAcknowledgementWorkflow` | Implemented | Complaint PII |
| `serviceRecoveryWorkflow` | Planned | Service records |
| `reportableIncidentDeadlineWorkflow` | Planned | Incident reports |
| `workerCredentialExpiryWorkflow` | Planned | Worker credentials |
| `invoiceApprovalWorkflow` | Planned | Financial |
| `claimValidationWorkflow` | Planned | NDIS claims |
| `evidencePackBuildWorkflow` | Planned | Documents |
| `telehealthAppointmentReminderWorkflow` | Planned | Health appointments |
| `livingAloneMonitoringWorkflow` | Planned | Participant safety |

---

## 7. Hardening Checklist (per workflow)

- [ ] Permission check at workflow start (not just API that starts it)
- [ ] Activity uses domain service, not raw Prisma from workflow code
- [ ] No env vars read inside workflow functions (deterministic constraint)
- [ ] Secrets fetched in activities from secure store
- [ ] Audit event on start, complete, fail, cancel
- [ ] Signal/query handlers authorize caller
- [ ] Tests: unauthorized start rejected

---

## 8. Deployment Notes

When enabling `TEMPORAL_ENABLED=true`:

- Use mTLS or API key for worker ↔ Temporal Cloud
- Network isolate worker from public internet
- Separate namespace per environment (dev/staging/prod)
- Do not share task queues across tenants without payload encryption review

---

## 9. Phase 8 Deliverables

1. Permission wrapper for workflow starters
2. Activity template with audit hook
3. Signal/query auth middleware
4. Security tests for complaint workflow path
5. Update this document with implementation status per workflow
