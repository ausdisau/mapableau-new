# Jobs adapter (Phase 4 stub)

**Status:** interface only — `JOBS_ADAPTER_STATUS.implemented = false`  
**Code:** [`lib/access/infrastructure/adapters/jobs/`](../../lib/access/infrastructure/adapters/jobs/)

## Intent

- Project workplace evidence → capabilities
- Keep occupational fit separate from access compatibility
- Employer disclosure firewall + receipts
- Never auto-reject on access mismatch
- Never implement employability / vulnerability / disability-severity scores

## Until Phase 4

Continue using `lib/jobs/matching/match-explanation-service.ts` and `lib/jobs/disclosure/disclosure-preview-service.ts`.
