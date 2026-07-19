# Access Independence MVP — QA notes

This document covers the Access Independence MVP (passport, preflight, step-by-step care request, drafts, barrier reports, map/list equivalence, consistent help, panel extensions) after security/privacy hardening.

**Important:** Meeting these checks does **not** claim WCAG 2.2 AA (or any WCAG) compliance for the whole product. Automated scans and the Accessibility Panel are helpers only. See `docs/brand/public-claims-register.md`.

## Automated checks that genuinely ran

Record results from the hardening verification run (update when re-run):

| Check | Command | Result |
| --- | --- | --- |
| Format | `pnpm format:check` | See verification section in PR notes |
| Types | `pnpm type-check` | See verification section in PR notes |
| Lint | `pnpm lint` | See verification section in PR notes |
| Unit/integration | `pnpm exec vitest run tests/access-independence tests/accessibility` | See verification section in PR notes |
| Playwright (a11y shells) | `pnpm exec playwright test tests/a11y/access-independence.spec.ts tests/a11y/accessibility-panel.spec.ts tests/a11y/route-shells.spec.ts` | See verification section in PR notes |
| Build | `pnpm build` | See verification section in PR notes |

## Manual accessibility checklist (remaining)

### Assistive technology — **Not run**

- [ ] **Not run** — NVDA + Chrome or Firefox: Access Passport, Care Request, barrier report tracking, provider barrier inbox.
- [ ] **Not run** — VoiceOver + Safari: same flows; dialogs announce name, trap focus, restore focus on close.
- [ ] **Not run** — Confirm Access Preflight fact states are spoken with labels, not colour alone.

### Keyboard only — **partially covered by Playwright; full authenticated flows Not run**

- [ ] **Not run** (authenticated) — Access Passport: select verified org, share, revoke; status announced; focus restoration.
- [ ] **Not run** (authenticated) — Care Request wizard end-to-end with account draft restore.
- [ ] **Not run** (authenticated) — Report tracking and provider barrier inbox keyboard completion.
- [ ] Tab through map landing: map/list toggle, place list, selected place, Access Preflight, Report barrier link, Consistent Help (smoke covered where Playwright seeds exist).
- [ ] Open/close Accessibility Panel and dialogs with Escape; focus returns to trigger.

### Voice control — **Not run**

- [ ] **Not run** — Visible names match spoken names for primary actions.

### Zoom and spacing — **Not run** (representative layouts)

- [ ] **Not run** — 320 px reflow on map landing, passport, care request, barrier form.
- [ ] **Not run** — 200% and 400% browser zoom: no clipped controls; sticky sharing status does not obscure focus.
- [ ] **Not run** — Text spacing: no overlapping labels.

### Motion, contrast, touch — **Not run**

- [ ] **Not run** — OS reduced motion, high contrast / forced colours, touch targets.

### Cognitive / plain-language walkthrough — **Not run**

- [ ] **Not run** — “Share only mobility needs with a verified organisation until next Friday.”
- [ ] **Not run** — “Check whether this place has a Changing Places toilet before I go.”
- [ ] **Not run** — “Start a care request, leave halfway, sign in again, resume.”
- [ ] **Not run** — “Report a lift barrier without uploading a photo.”

## Privacy and security checks

- [x] UI panel / digital preferences are not included in provider-facing share payloads.
- [x] Consent binds `grantedToOrganisationId` after server verification; free-text recipient is display-only.
- [x] Superseded active consent is revoked in the same transaction as replacement.
- [x] Local drafts use schema allowlists — care description/address/access summary/tasks not stored in localStorage by default.
- [x] Provider barrier list/update scoped by organisation membership; cross-tenant IDs return 404.
- [x] Reporter contact and triage notes omitted from provider list select.
- [x] Magic links are one-time, hashed at rest, rate-limited; external callbacks rejected.
- [x] Anonymous barrier submissions rate-limited; remote image URLs rejected (upload deferred).
- [x] Safety-critical reports show emergency boundary (MapAble is not emergency monitoring).

## Known limitations / dependencies

1. **No canonical place→organisation ownership** in Prisma. Provider inbox is fail-closed to reports with explicit `organisationId` (admin assignment). Unassigned reports stay on `/api/admin/access-barrier-reports`.
2. **Image upload deferred** — no remote URL substitute; keyboard-accessible MIME-restricted upload to be wired later.
3. **Authenticated Playwright seeds** for passport / care / provider inbox still needed for full keyboard regression.
4. **Map movement** must not announce every pan/zoom (preserve list equivalence; avoid live-region spam).

## Auth review notes

| Requirement | Status |
| --- | --- |
| Password managers / autofill | Supported |
| Copy/paste allowed | Supported |
| Passkeys | Available |
| Email magic links | One-time DB token (`MagicLinkToken` hash only) + SendGrid; IP/email rate limits; generic responses |
| SMS sign-in | Twilio 2FA after password when enabled |
| Drafts | Local = allowlisted progress; account = authenticated `/api/form-drafts` for sensitive fields |
| Longer task idle warning | `TaskIdleWarning` on step-by-step forms |

## Provider barrier inbox

- Route: `/provider/access-barriers` (org-scoped only)
- Admin moderation: `/api/admin/access-barrier-reports` (+ `[id]` assign org)
- Workflow: received → reviewing → actioned → closed (with status history)
- Feature flag: `ACCESS_INDEPENDENCE_PROVIDER_BARRIER_INBOX` (default on; still fail-closed without `organisationId`)

## Commands

```bash
pnpm db:generate
pnpm format:check
pnpm type-check
pnpm lint
pnpm exec vitest run tests/access-independence tests/accessibility
pnpm exec playwright test \
  tests/a11y/access-independence.spec.ts \
  tests/a11y/accessibility-panel.spec.ts \
  tests/a11y/route-shells.spec.ts
pnpm build
```
