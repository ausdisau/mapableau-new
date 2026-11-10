# Accessibility, AAC, MFA recovery and rollback

## Portal expectations (AD.iD)

- **Keyboard / switch:** all primary actions reachable via Tab/Shift+Tab; visible `:focus-visible`; no keyboard traps in custom chrome (Clerk widgets inherit vendor behaviour — verify in human test).
- **Screen readers:** `lang="en-AU"`, skip link to `#main-content`, labelled landmarks (`main`, `nav`, `header`), honest “Access not verified” service status.
- **Zoom / reflow:** fluid type (`clamp`), single-column reflow under ~720px, no horizontal lock in custom CSS.
- **Reduced motion:** `prefers-reduced-motion: reduce` disables non-essential transitions.
- **AAC:** prefer plain-language labels (“Sign in securely”, “Sign in to AD.iD”); avoid relying on colour alone for status.

## MFA / passkey recovery

- Recovery UX is Clerk UserProfile at `/account` (MFA, passkeys, sign-out).
- Operators must verify in a Clerk **development** instance: enroll MFA, lose-device recovery path, and passkey add/remove with keyboard + SR.
- Do not build a parallel recovery flow that emails magic links with tokens in URLs.

## Wix Stage 1 control

- Button label: “Sign in to AD.iD”.
- Accessible name must state it is separate from Wix Members login (see `STAGE1_BUTTON_HINT`).

## Human test checklist (isolated env)

1. Sign-in / sign-out with keyboard only.
2. Screen reader announces page title, skip link, main heading.
3. 200% and 400% zoom; content reflows.
4. OS reduced-motion setting respected.
5. MFA enroll + recovery via `/account`.
6. Switch / AAC user path: large hit targets, no time-limited traps on custom pages.
7. Confirm no identity tokens in address bar or `localStorage` from AD.iD code.

## Rollback

Disable preview; revoke Clerk development keys used for the pilot; leave Wix production and other app identity systems untouched.
