# Accounts centre

Unified account hub at **`/dashboard/account`** for Participants, Providers, and Workers. Access is gated by RBAC permissions `account:read:self` and `account:manage:self`.

## Personas

| Persona | Typical roles | Sections shown |
| ------- | ------------- | -------------- |
| **participant** | `participant`, `family_member` | Identity, profile, accessibility, consent, billing, notifications, security |
| **provider** | `provider_admin`, `transport_operator` | Identity, organisations, billing (Stripe Connect), notifications, portals → provider console |
| **worker** | `support_worker`, `driver` | Identity, worker profile, organisation, notifications, portals → `/worker/*` |
| **coordinator** | `support_coordinator`, `plan_manager` | Identity, notifications (read-focused) |

Persona resolution: [`lib/auth/account-access.ts`](../lib/auth/account-access.ts) (`getAccountCentrePersona`). Section flags: [`lib/core-ui/account-centre-sections.ts`](../lib/core-ui/account-centre-sections.ts).

## RBAC

- Permissions are defined in [`lib/auth/permissions.ts`](../lib/auth/permissions.ts).
- **`userHasPermission(user, permission)`** checks **all** roles on the user (`User.primaryRole` + `UserRoleAssignment`), not only `primaryRole`.
- Page guard: `requireAccountAccess()` in [`lib/auth/guards.ts`](../lib/auth/guards.ts).
- API guard: `requireApiPermission("account:read:self")` in [`lib/api/auth-handler.ts`](../lib/api/auth-handler.ts).

## API

### `GET /api/account/summary`

Returns aggregated account state (profile snippets, billing accounts, organisations, worker profile, notification unread count, Stripe preflight). Implemented in [`lib/account/account-summary-service.ts`](../lib/account/account-summary-service.ts).

## Navigation

- Dashboard nav links are filtered by persona and permission via [`lib/core-ui/dashboard-nav.ts`](../lib/core-ui/dashboard-nav.ts).
- Provider console includes **Accounts** → `/dashboard/account`.
- Worker header includes **Accounts**.

## Test users

From [`prisma/seed-mapable-core.ts`](../prisma/seed-mapable-core.ts) (password from seed):

| Email | Role |
| ----- | ---- |
| `participant@mapable.test` | participant |
| `worker@mapable.test` | support_worker |
| `admin@mapable.test` | mapable_admin |

## Related docs

- [billing.md](./billing.md) — participant billing centre and Stripe Checkout
- [stripe-connect.md](./stripe-connect.md) — provider Connect Express payouts
