# Security Hardening — Productisation Wave 1

Branch: `cursor/api-tenant-hardening-6ea8`

## Delivered

1. **Dedicated encryption keys** — `lib/security/encryption-keys.ts`; `lib/crypto/ndis.ts` no longer falls back to `NEXTAUTH_SECRET`.
2. **High-risk Zod** — micro-consent POST, data-vault POST; inventory in `lib/security/high-risk-routes.ts`.
3. **Tenant scope** — `/api/billing/overview` asserts organisation membership; billing + `assertOrganisationAccess` admin path uses break-glass when enforced.
4. **Break-glass** — `POST /api/admin/break-glass` time-boxed sessions; `MAPABLE_REQUIRE_ADMIN_BREAK_GLASS`.
5. **IDOR / key tests** — `tests/security/*`.

## Rollback

Revert this PR; set `MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK=true` only for local recovery; never restore session-secret encryption fallback.
