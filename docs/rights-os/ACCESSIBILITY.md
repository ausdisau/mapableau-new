# Accessibility

Rights Centre and RightsOS flows must meet the same accessibility bar as the rest of MapAble — refusal and revocation are as easy as approval.

## Requirements

- **Refusal parity:** Deny, revoke, and dissent controls are the same size and prominence as approve.
- **Plain language:** `explain.ts` templates avoid legal jargon; reading level targets general audience.
- **Keyboard:** All Rights Centre nav and forms are keyboard-operable without hover-only affordances.
- **Screen readers:** Policy explanations expose outcome, allowed fields, and denied fields in logical order.
- **No time pressure:** Capsule and lease expiry warnings appear in advance; no countdown-only UI.

## Decision Room

- Options use headings and descriptions, not icon-only choices.
- Dissent is recorded with a text area and confirmation — not a hidden gesture.
- Participant wording fields support AAC-friendly short sentences.

## Capsule fallbacks

QR and printable card paths exist for participants who do not use smartphones. Phone verification provides a staff-assisted path.

## Testing

- Automated: Playwright + axe on `/rights/*` when UI flags enabled
- Manual: pilot participants with screen readers and switch access

## Related

- [DECISION_ROOM.md](./DECISION_ROOM.md)
- [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md)
