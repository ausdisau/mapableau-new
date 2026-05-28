## Learned User Preferences

- When implementing an attached plan: do not edit the plan file; use existing todos, mark them in_progress as you work, and complete all todos without stopping early.
- Do not recreate todos that already exist for a plan the user attached.
- When the user supplies an authoritative staged-file list for commit: commit only those staged files, do not stage additional files, write a concise message, and push.
- When asked to commit and push branch work: stage only the changes for that task, exclude unrelated files, write a concise message, and push.
- Do not open VS Code as part of agent workflows.
- Prefer installed Cursor plugin skills (Stripe, Vercel, Supabase, Prisma, etc.) when the user asks to integrate those services.

## Learned Workspace Facts

- MapAble (`mapableau-new`, GitHub `ausdisau/mapableau-new`) is an accessibility-first Australian disability care and support platform for NDIS participants, nominees, providers, workers, coordinators, and admins—not a generic EMR, ERP, marketplace, or social-media clone.
- MapAble domain data (participants, providers, bookings, access needs, consent, invoices, quality, safeguarding, outcomes) is the source of truth; open-source frameworks integrate as engines under `lib/integrations/` with feature flags.
- Core stack: Next.js App Router, TypeScript, Tailwind, pnpm, Prisma/Postgres, Zod; role-aware and consent-aware access control with audit logging across Care and related modules.
- Deployed on Vercel; Supabase is used for Postgres/auth in several flows; local dev uses `pnpm install` and `pnpm dev`.
- Platform hub is `/core` (account/billing/messaging/support strip, care/transport/employment pillars, and roadmap satellite apps in `lib/core-ui/`); integration health/admin is `/admin/integrations` (`mapable_admin`); optional integration env is validated with `pnpm check:integrations-env`.
- Provider Cloud (`/provider/cloud`) is the provider org control plane: Provider Pro billing is user-scoped on the signed-in user's `BillingAccount` (not the organisation row); console access bridges `OrganisationMember` and legacy `ProviderUserRole` via `lib/providers/provider-access.ts`; providers get read-only integration status unless `mapable_admin`.
- Active product areas include Care MVP, Peer support (moderated lived-experience community, not social media), Access/places, provider search, transport and accessible ride-sharing/AV fleet, Stripe Checkout, conferencing/AAC, and OSS integration pack work (MapLibre, Keycloak, Temporal, n8n, Directus, Metabase, FHIR, telehealth, scheduling).
- Australian NDIS domain patterns include provider-registry imports, postcode lookup, and provider fields such as ABN and `ndisRegistered`; search flows center on `lib/search/autocomplete-service.ts` and MapAble provider search UI components.
