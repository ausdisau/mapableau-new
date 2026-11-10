# AccessiMart review storefront — accessibility checklist

Automated tests do **not** claim WCAG 2.2 AA conformance. Disability-led review remains a release gate.

## Manual checks (flag-gated preview only)

- [ ] Full keyboard navigation of catalogue filters, cards and detail pages
- [ ] Visible focus rings on all interactive controls
- [ ] Screen reader: NVDA and VoiceOver announce headings, filters, live result count
- [ ] Switch access / keyboard-only operation without pointer
- [ ] AAC-friendly plain-language labels and errors
- [ ] 200–400% zoom and reflow without horizontal scrolling of critical content
- [ ] Touch targets ≥ 44×44 px on primary actions
- [ ] `prefers-reduced-motion` respected (no required motion in this slice)
- [ ] Save-and-return / interruption: leaving filters and returning does not invent purchases
- [ ] Clear “not verified” / commerce-disabled messaging

## Intentionally avoided from AccessiMart source

- `maximum-scale=1` viewport meta
- Missing skip-to-content (review layout includes skip link)
