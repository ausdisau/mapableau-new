# Phase 32 — Tenancy boundary

`Organisation.id` is the LOCKED tenant boundary. See
`docs/platform/wave-8-architecture-and-risk-plan.md` for context.

- Every table carrying participant/worker/claim data is scoped by
 `organisationId`.
- `Tenant` / `TenantMembership` / `EnterpriseProviderWorkspace` remain
 workspace grouping only.
- Parent/hub links do NOT grant unrestricted access.
- Platform admin has NO ambient cross-tenant read — see
 `lib/tenancy/access/platform-admin-policy.ts`.

Disclaimers: env ≠ entitlement, entitlement ≠ assurance, assurance ≠ GA.
