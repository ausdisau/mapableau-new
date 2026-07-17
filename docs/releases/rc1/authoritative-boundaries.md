# RC1 authoritative boundaries

## Context sources

RC1 does not rewrite request or tenant context. It documents the authoritative modules already present:

| Boundary                  | Authoritative module                            | RC1 note                                                                                      |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Authenticated user        | `lib/auth/current-user.ts`                      | `CurrentUser` remains the user contract.                                                      |
| Auth and route guards     | `lib/auth/guards.ts`, `lib/auth/permissions.ts` | Route handlers must use existing guards/permissions.                                          |
| Tenant context            | `lib/tenancy/context/tenant-context.ts`         | `Organisation.id` remains the tenant boundary; `null` is not all tenants.                     |
| Request tenant resolution | `lib/tenancy/context/request-context.ts`        | Header/query tenant hints still require membership checks.                                    |
| Duplicate candidate       | `lib/multi-tenant-admin/tenant-context.ts`      | Deprecated for RC1 authority decisions; retained until a safe consolidation migration exists. |

## Authority boundaries

Consent, delegation, and AURA authority must pass through existing Wave 9-10 services:

- Consent: `lib/consent/consent-service.ts` and `lib/consent/require-consent.ts`.
- Delegation: `lib/delegation/authority.ts` and `lib/tenancy/federation/delegated-administration.ts`.
- AURA: `lib/aura/authority/evaluate.ts` and `lib/aura/approvals/binding.ts`.

RC1 adds adapters under `lib/release-candidate/context/` only to document the boundary and support architecture tests. It does not mint new authority.
