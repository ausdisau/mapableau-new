# Phase 32 — Break-glass

`lib/tenancy/access/break-glass-service.ts` implements audited cross-tenant
elevation for platform admins.

- Reason: 20+ chars.
- Expiry: up to 8 hours.
- Self-approval: denied.
- Every request/approve/revoke writes an `AuditEvent`.
- AI must not approve break-glass. A human approver is required.
- Break-glass session id must be attached to the request context —
 `TenantContext.breakGlassSessionId` — for any cross-tenant read to succeed
 through `platform-admin-policy.evaluatePlatformAdminRead`.
