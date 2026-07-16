# Accessibility — Physical Systems UI

Target: **WCAG 2.2 AA** for all Physical surfaces (Scout, Concierge, Venue Ops, Simulator, Actions), consistent with Core [ACCESSIBILITY.md](../access-intelligence/ACCESSIBILITY.md).

## Requirements

| Area | Rule |
|------|------|
| Structure | Landmarks, skip link, logical headings |
| Keyboard | All approvals, action lists, Scout flows operable; ~44px targets |
| Focus | Visible focus rings (MapAble Care tokens) |
| Colour | Status never by colour alone (icon + text) |
| Routes | **Map-free** ordered text instructions always; map optional |
| Motion | Respect `prefers-reduced-motion`; no essential info in animation only |
| Chat optional | Plan / Explore / Passport paths without ToolLoopAgent |
| Language | Plain language; fictional twin warning programmatically associated |

## Live-region restraint

Streaming Concierge and action status updates must not flood `aria-live`.

- Prefer polite, low-frequency summaries (“Checking access evidence…”, “Action approved”) over per-token chatter when possible.
- Atomic status changes on action cards use concise live updates; avoid logging every poll tick to a live region.
- Errors use `role="alert"` sparingly for true failures, not routine denies already visible in the card body.
- Simulator event playback must offer pause and must not auto-spam live regions.

## Approvals

Physical dispatch approvals mirror Core: `alertdialog`, initial focus, recipient/purpose/effect summary, Approve/Cancel.

## Testing

- Manual keyboard pass on `/access-intelligence/physical/*`
- Automated axe when Playwright lands in repo
- Verify route steps readable with maps disabled / CSS map hidden

## Related

[ROUTING.md](./ROUTING.md) · [CONSENT_AND_PRIVACY.md](./CONSENT_AND_PRIVACY.md)
