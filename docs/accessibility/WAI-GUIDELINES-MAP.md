# WAI guidelines map (WCAG · ATAG · UAAG)

**Not a conformance claim.** MapAble designs *toward* these W3C WAI guideline families. Formal ATAG / UAAG / WCAG conformance requires completed evaluation evidence and must not be asserted from this document alone.

Canonical claim posture: [ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md](./ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md), public statement at `/accessibility-statement`.

## Sources

| Family | Role | Primary references |
|--------|------|--------------------|
| **WCAG** | Accessible **web content** | [WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/); project target **WCAG 2.2 AA** |
| **ATAG 2.0** | Accessible **authoring tools** + helping authors produce accessible content | [ATAG overview](https://www.w3.org/WAI/standards-guidelines/atag/), ATAG 2.0 Recommendation |
| **UAAG 2.0** | Accessible **user agents** (browsers, players, readers, preference UIs that render/control content) | [UAAG 2.0](https://www.w3.org/TR/UAAG20/), [UAAG 2.0 Reference](https://w3c.github.io/UAAG/UAAG20-Reference/) |

WAI’s [Essential Components of Web Accessibility](https://www.w3.org/WAI/fundamentals/components/) describes how content (WCAG), authoring tools (ATAG), and user agents (UAAG) work together. Prefer the **latest WCAG 2.x** when ATAG 2.0 text still cites WCAG 2.0.

## How MapAble surfaces map

| MapAble surface | Primary guideline | Why |
|-----------------|-------------------|-----|
| Marketing / public informational pages (`app/(marketing)`, `components/marketing`) | **WCAG 2.2** | Static/SSR content, navigation, forms (pre-register, contact) |
| Accessibility preferences panel (`AccessibilityPanel`, display prefs) | **UAAG-informed** + WCAG | User-controlled text size, contrast, motion, focus — UAAG Principle 1/2 preference & configuration themes; panel UI itself must meet WCAG |
| Places / contribution / community drafting (`apps/places`) | **ATAG 2.0** Part A + B (+ WCAG for rendered UI) | Authors create observations/posts; see [../places ACCESSIBILITY-QA](../../apps/places/ACCESSIBILITY-QA.md) |
| Dashboards, CareOS, provider consoles | **WCAG 2.2** (ATAG only where in-product editors exist) | Application UI; authoring rules apply when users publish content |

## Marketing redesign checklist (this PR stream)

Apply on public chrome without claiming certification:

### WCAG 2.2 AA (content)
- [ ] Semantic landmarks/headings; skip link reaches `#main-content`
- [ ] Visible focus rings on all interactive marketing controls
- [ ] Text/non-text contrast on navy/orange/royal surfaces (including hero overlays)
- [ ] Target size ≥ 44×44 CSS px for primary CTAs and nav controls
- [ ] No information by colour alone (pathway tiles, trust checks)
- [ ] Keyboard order matches visual order across utility strip → brand row → primary nav → hero CTAs

### UAAG 2.0 themes (user-agent / preferences)
- [ ] Accessibility settings discoverable from marketing header (panel trigger + statement link)
- [ ] Text scale / contrast / reduced-motion preferences persist and do not trap focus
- [ ] Preference changes are reversible (reset) and announced where status regions exist
- [ ] Do not block assistive technology; keep native controls/`dialog` semantics on the panel

### ATAG 2.0 themes (only where marketing hosts authoring)
- Marketing splash does **not** host rich authoring; pre-register/contact are simple forms → WCAG form SCs, not full ATAG Part B.
- Any future in-page contribution widgets on marketing routes must inherit Places ATAG Part A/B prompts (labels, repair guidance, preview before publish).

## Related product docs

- Places ATAG/WCAG acceptance plan: `apps/places/ACCESSIBILITY-QA.md`
- Manual evidence matrix: `docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md`
- Brand/marketing visual inspiration (separate from WAI standards): `docs/brand/dpo-design-inspiration.md`
