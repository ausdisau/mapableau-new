# MapAble Cloud — Cursor prompt pack

## 1. Product purpose

SaaS infrastructure for disability providers: rostering, billing, participant records, compliance, messaging, reporting, service coordination.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Tenant owner | Billing, users, settings |
| Org admin | Workspace config, reports |
| Scheduler | Rosters (later) |
| Finance | Invoices, usage |
| MapAble platform admin | Tenant provision, support |

## 3. MVP features

- `CloudTenant` + `ProviderWorkspace` provisioning
- `TenantUser` invite / role assignment
- `SubscriptionPlan` display (starter/pro) — Stripe adapter stub
- `UsageRecord` monthly counters (bookings, SMS)
- `CloudSettings` (timezone, branding logo URL, data region)
- Tenant switcher in provider nav
- Basic usage dashboard

## 4. Later features

- Full rostering, payroll export
- Multi-site orgs
- White-label domains
- SOC2 evidence pack export

## 5. Database tables

`CloudTenant`, `TenantUser`, `ProviderWorkspace`, `SubscriptionPlan`, `TenantSubscription`, `UsageRecord`, `CloudSettings`

## 6. API routes

```
GET/POST /api/cloud/tenants
GET/PATCH /api/cloud/workspaces/[workspaceId]
GET/POST /api/cloud/tenant-users
GET      /api/cloud/usage
GET/PATCH /api/cloud/settings
POST     /api/admin/cloud/tenants
```

## 7. Frontend

- `app/provider/cloud/page.tsx`, `settings`, `usage`, `team`
- `components/cloud/TenantSwitcher`, `PlanCard`, `UsageMeter`

## 8. Integrations

Provider Portal, Billing/Stripe, Compliance audit export, Messaging, NDIS layer (read-only status).

## 9. Accessibility

- Data tables with card fallback on mobile
- Clear plan comparison table headers

## 10. Privacy

- Strict tenant isolation in all queries (`organisationId` / `tenantId`)
- No cross-tenant participant search

## 11. Audit

`cloud.tenant.created`, `cloud.user.invited`, `cloud.settings.updated`, `cloud.subscription.changed`

## 12. Tests

- Tenant A cannot read Tenant B workspace
- Usage increment atomic

## 13. Seed

Demo tenant “Sunrise Supports”, 2 users, starter plan.

**Branch:** `cursor/cloud-mvp-ce11`
