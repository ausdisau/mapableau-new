# MapAble Transport — Accessibility Test Report

Target: WCAG 2.2 AA.

## Automated / unit

- Vitest covers claim registry and quote adapter labelling.
- Forms use labelled controls, `role="alert"` for errors, `aria-live` for quote loading.

## Manual checklist (required before production_ready UI claims)

| Check | Status |
| --- | --- |
| Keyboard-only request → quote → accept | Pending manual |
| 200% zoom reflow on `/transport/request` and profile | Pending manual |
| Screen reader status announcements for quotes | Implemented (live region) |
| Map not required (list/form alternatives) | Quote list is non-map |
| Focus visible on primary actions (48px targets) | Primary buttons use min-h-12 |
| Colour not sole status cue | Status badges include text labels |
| NVDA / VoiceOver / TalkBack | Pending manual |

## Known gaps

- Full axe CI smoke not yet wired for all transport routes.
- Driver offline queue UI announcements need field-device validation.
