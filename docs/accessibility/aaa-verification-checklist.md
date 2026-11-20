# WCAG 2.2 AAA / ATAG verification checklist (WS9)

Complete **per PR** before merging; complete the **final** block before updating
the public accessibility statement to an unrestricted claim.

## Per-PR automated

- [ ] Targeted vitest for touched modules
- [ ] `pnpm type-check` with ≥6GB heap
- [ ] ESLint on touched Next files (heap-safe invocation)
- [ ] Axe AAA on affected marketing routes (`marketing-aaa` / informational projects)
- [ ] Screenshots under `/cursor/stores/self/media/` when UI changes

## Manual template (each surface)

| Check | Marketing | Vite client | Authoring |
| --- | --- | --- | --- |
| Keyboard only (no trap) | | | |
| Visible dual focus ring | | | |
| Forced colours | | | |
| 400% zoom / reflow | | | |
| NVDA pass | | | |
| VoiceOver pass | | | |
| 44×44 targets | | | |

## User testing

- [ ] Recruit people with disability (screen reader, keyboard-only, low vision, cognitive)
- [ ] Record issues with route, AT, severity, suggested fix
- [ ] Only after issues are remediable or documented as exceptions, update the statement

## CodeRabbit

Local CLI is auth-blocked for agents. A human runs:

```bash
coderabbit auth login
coderabbit review --agent --committed --base main
```

GitHub CodeRabbit check must pass on each remediation PR.

## Claim status

**Scoped claim published** on `/accessibility-statement` (see WS7). Do **not**
remove the “user testing required” exception until the tables above are complete.
