# PR review checklist (MapAble Prompt Pack)

Use before merging Prompt Pack work.

## Functionality

- [ ] Existing mapable.com.au routes still work
- [ ] New pages are linked from homepage, resources, or nav where appropriate
- [ ] `/accessibility-map` → `/access` and `/jobs` → `/employment` redirects work

## Accessibility

- [ ] Keyboard navigation reaches main CTAs on `/` and `/access`
- [ ] Forms have labels and accessible errors
- [ ] `pnpm test:a11y` passes (no critical axe violations)

## Privacy and security

- [ ] Interest/contact forms validated server-side
- [ ] Sensitive fields not logged or sent to analytics
- [ ] NDIS-related copy uses guidance language, not guarantees

## Demos

- [ ] `/demo/care-transport` and employment demo clearly labelled as demos
- [ ] Governance status cards render for review/blocked states

## Quality gates

- [ ] `pnpm type-check`
- [ ] `pnpm test` (focused + new tests)
- [ ] `pnpm build`
- [ ] `docs/deployment-runbook.md` updated if deploy steps changed

## Known limitations

- Contract runner pure layer is server-only (`node:crypto`); client demos use NDIS rule flags only
- Production analytics require explicit `setConsentState(true)`
- Playwright a11y smoke needs built app (`pnpm build` before `pnpm test:a11y`)
