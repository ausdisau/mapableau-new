# Mobile accessibility plan

## Principles

Accessibility is a product requirement, not a retrofit. Components in `packages/mapable-accessibility` and `apps/mobile/src/accessibility` are the only supported UI primitives for interactive controls.

## Platforms and assistive tech

| Capability | iOS | Android |
|------------|-----|---------|
| Screen reader | VoiceOver | TalkBack |
| Switch access | Switch Control | Switch Access |
| Keyboard | Bluetooth keyboard | Bluetooth keyboard |
| Text scale | Dynamic Type to 200%+ | Font scale to 200%+ |
| Motion | Reduce Motion | Remove animations |
| Contrast | Increase Contrast | High contrast / bold text |

## Component library (required)

AccessibleButton, AccessibleField, AccessibleCheckbox, AccessibleRadioGroup, AccessibleSegmentedControl, AccessibleDialog, AccessibleBottomSheet, AccessibleStatus, AccessibleErrorSummary, AccessibleTimeline, AccessibleEvidenceCard, AccessibleConfirmationCard, AccessibleMapAlternative, AACPromptGrid, PlainLanguageToggle.

## Rules

- Every control has an accessible name; roles and states exposed.
- Touch targets ≥ 48dp where practical.
- No colour-only meaning; no gesture-only actions.
- Maps always offer list + search alternatives.
- Charts require text summaries.
- Live regions: polite by default; assertive only for urgent continuity.
- Voice interpretation always confirmed before consequential action.
- Unusual/dysarthric speech must never be framed as incapacity.

## Test matrix

Automated: RN Testing Library a11y props, schema tests for AAC contracts.  
Manual pilot: VoiceOver, TalkBack, switch, large text, AAC users (see `pilot-plan.md`).
