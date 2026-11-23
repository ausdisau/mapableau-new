# WAI guidelines map (WCAG · ATAG · UAAG)

**Not a conformance claim.** MapAble designs *toward* these W3C WAI guideline families. Formal ATAG / UAAG / WCAG conformance requires completed evaluation evidence and must not be asserted from this document alone.

Canonical claim posture: [ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md](./ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md), public statement at `/accessibility-statement`.

## Sources

| Family | Role | Status / references |
|--------|------|---------------------|
| **WCAG 2.2** | Accessible **web content and web applications** across MapAble | W3C Recommendation; [WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/); project design target **WCAG 2.2 AA** |
| **ATAG 2.0** | Accessible **authoring tools** (Part A) + helping authors produce accessible content (Part B) | W3C Recommendation; [ATAG overview](https://www.w3.org/WAI/standards-guidelines/atag/) |
| **UAAG 2.0** | Guidance originally written for **user agents** (browsers, players, readers) | **Working Group Note** (not a W3C Recommendation); [UAAG 2.0](https://www.w3.org/TR/UAAG20/), [UAAG 2.0 Reference](https://w3c.github.io/UAAG/UAAG20-Reference/) |

WAI’s [Essential Components of Web Accessibility](https://www.w3.org/WAI/fundamentals/components/) describes how content (WCAG), authoring tools (ATAG), and user agents (UAAG) work together. Prefer the **latest WCAG 2.x** when ATAG 2.0 text still cites WCAG 2.0.

**UAAG posture for MapAble:** display preferences (text size, contrast, motion, focus) use **UAAG-informed design guidance**. Shipping a preference panel does **not** make MapAble a user agent, and MapAble does **not** claim UAAG conformance.

## How MapAble surfaces map

| MapAble surface | Primary guideline | Why |
|-----------------|-------------------|-----|
| **All MapAble web interfaces** (marketing, Places UI, auth, dashboards, CareOS, provider consoles, preference panel chrome) | **WCAG 2.2** | WCAG covers web content *and* web applications |
| Places / contribution / community drafting (`apps/places`) | **ATAG 2.0** Part A + Part B (+ WCAG for rendered UI) | Authors create, edit, and publish observations/posts; see [Places ACCESSIBILITY-QA](../../apps/places/ACCESSIBILITY-QA.md) |
| Accessibility preferences panel (`AccessibilityPanel`, display prefs) | **WCAG 2.2** for the panel UI; **UAAG-informed** for preference themes | Useful guidance for configuration UX; not a UAAG product claim |
| Future in-product editors outside Places | **ATAG 2.0** Part A + B when authors publish content | Same authoring rules as Places |

## Marketing redesign checklist (this PR stream)

Apply on public chrome without claiming certification:

### WCAG 2.2 AA (content)
- [x] Semantic landmarks/headings; skip link reaches `#main-content` (navy focus chrome; PublicInfo section `h2`s)
- [x] Visible focus rings on interactive marketing controls (`mapableCareFocusRing` / orange rings)
- [ ] Text/non-text contrast on navy/orange/royal surfaces (including hero overlays) — needs human measure
- [x] Target size ≥ 44×44 CSS px for primary CTAs and utility-strip controls (`min-h-11`)
- [ ] No information by colour alone (pathway tiles, trust checks) — needs human review
- [ ] Keyboard order matches visual order across utility strip → brand row → primary nav → hero CTAs — needs human review

### UAAG-informed themes (display preferences — not a UA claim)
- [x] Display settings discoverable from marketing header (panel trigger + statement link, distinct labels)
- [ ] Text scale / contrast / reduced-motion preferences persist and do not trap focus — gate G-PREFS
- [ ] Preference changes are reversible (reset) and announced where status regions exist — gate G-PREFS
- [x] Do not block assistive technology; keep native controls/`dialog` semantics on the panel

### ATAG 2.0 themes (only where marketing hosts authoring)
- Marketing splash does **not** host rich authoring; pre-register/contact are simple forms → WCAG form SCs, not full ATAG Part B.
- Any future in-page contribution widgets on marketing routes must inherit Places ATAG Part A/B prompts (labels, repair guidance, preview before publish).

## Next acceptance gate (human evidence — `NOT_RUN` until recorded)

Do **not** mark these complete without documented human evaluation. Record commit SHA, environment, results, known limitations, and human-review status in [ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md](./ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md).

1. **Places ATAG Part A + Part B** — evaluate authoring/editing/publishing against Places [ACCESSIBILITY-QA.md](../../apps/places/ACCESSIBILITY-QA.md), including accessible content output.
2. **Display preferences** — keyboard, screen readers, 200–400% zoom, reduced motion, and persistence across sessions.
3. **Matrix rows** — each tested journey cites tip SHA and remains non-claim until evidence lands.

Release posture: ship accessibility review PRs; **do not** assert WCAG, ATAG, or UAAG conformance until applicable requirements are evaluated against documented evidence.

## Related product docs

- Places ATAG/WCAG acceptance plan: `apps/places/ACCESSIBILITY-QA.md`
- Manual evidence matrix: `docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md`
- Brand/marketing visual inspiration (separate from WAI standards): `docs/brand/dpo-design-inspiration.md`
