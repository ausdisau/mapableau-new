# Access Signals traceability

| Requirement | File | Test | Status |
|---|---|---|---|
| Flag default off + production hard-off | `flags.ts` | `gais-and-flags.test.ts` | done |
| Invariants 1–12 | `evaluate.ts` | `evaluate.test.ts` | done |
| Synthetic network | `network-fixture.ts` | evaluate incomplete route | done |
| GAIS Unknown import | `gais-compatibility.ts` | `gais-and-flags.test.ts` | done |
| Public map+list | `app/access-signals` | manual / flag gate | done |
| Assessor thin flow | `app/assessor/access-signals` | auth + flag | done |
| Admin remediation | `app/admin/access/signals` | closed ≠ Green test | done |
| Drive framework reconcile | — | — | **open gate** |
