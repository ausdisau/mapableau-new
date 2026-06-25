# MapAble engineering rules

MapAble is an accessibility-first disability technology platform for Australia and New Zealand.

## Principles

- Accessibility is a core requirement, not a polish task.
- Use WCAG 2.2 AA as the default digital accessibility target.
- Prefer semantic HTML over ARIA patches.
- All forms need labels, accessible errors, and server-side validation.
- Do not log sensitive access needs, health, disability, NDIS, address, or free-text support details.
- Use Australian English.
- Use practical, rights-based language. Avoid inspiration tropes.
- Treat NDIS and funding outputs as guidance unless reviewed and approved.
- Do not overclaim legal compliance, clinical outcomes, or guaranteed funding.
- Build modular services: Core, Map, Care, Transport, Jobs, Accreditation, Governance.
- Preserve current deployment and routing conventions unless explicitly refactoring.
- Before implementing, inspect the repo and adapt paths to the existing stack.

## Preferred product sequencing

1. Public site and early access funnel.
2. Accessibility map and venue contribution workflow.
3. Care + Transport bundled demo.
4. Inclusive Jobs and support planning demo.
5. Accreditation scoring.
6. NDIS rule engine.
7. Contract and attestation layer.
8. Full authenticated MapAble Core dashboard.

## Commands

- `pnpm setup:cloud-agent` — install + prisma generate
- `pnpm dev` — local dev
- `pnpm lint` / `pnpm type-check` / `pnpm test` / `pnpm test:a11y` / `pnpm build`

## Docs

- `docs/cursor-site-audit.md` — stack and route audit
- `docs/product-backlog.md` — MVP backlog
- `docs/design-system.md` — UI tokens
