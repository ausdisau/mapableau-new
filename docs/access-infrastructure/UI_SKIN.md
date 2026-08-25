# Access UI skin (mapable.com.au)

**Status:** My Access + place compatibility panel (flag-gated)  
**Public claim:** none

## Ownership

`mapable.com.au` owns presentation, navigation, accessible interactions, maps, list views, forms, explanations, consent interfaces, and participant confirmation.

It is **not** the source of truth for compatibility, evidence, credentials, or AI inference.

## Routes

| Route | Flag | Role |
| --- | --- | --- |
| `/my-access` | `MAPABLE_ACCESS_PASSPORT_ENABLED` (+ master) | Participant read/edit of Access Passport |
| `/dashboard/accessibility` | always | Presentation / legacy prefs; links to My Access |
| `/access/places/[placeId]` | capabilities / compatibility flags | Place profile + optional personalised panel |
| `/access` / place list | always | Non-map alternative |

## My Access sections

Movement · Communication · Vision · Hearing · Thinking & information · Sensory environment · Fatigue & stamina · Personal support · Transport · Toilets · Technology · Emergency access · Sharing · Service & admin

Participant-facing titles use human labels from `lib/access/infrastructure/ui-copy.ts` (not raw ontology IDs). Importance and sharing options use plain phrases (e.g. “Must have”, “Share when I approve”). Default visibility is draft + **Save sharing** (not auto-saved on change). Remove requires an inline confirm. Empty passports offer a “Start with 3 common needs” checklist.

## Place result panel

When flags allow, show (AT priority order):

1. Status word + explanation (`Compatible` / `Needs adjustment` / `Unknown` / `Mismatch`) — `role="status"`
2. Known mismatches
3. What we don't know
4. What may need adjustment
5. What works for you
6. Evidence / last checked
7. Alternatives & limitations
8. Report a change
9. Non-map browse link
10. Privacy line: opening My Access does not share needs with the place until the participant chooses

Concept IDs from the engine are resolved to human labels in the UI. Never rely on “Accessible ✅” alone.

## Accessibility baseline

WCAG 2.2 AA for My Access and place compatibility surfaces: keyboard, visible focus, names/roles/states, reflow, plain-language errors, reduced motion, accessible dialogs for report actions (focus trap, Esc restores trigger focus).

### Flag-on a11y testing

CI Accessibility workflow enables AaI passport/capabilities/compatibility flags for Playwright only (production defaults remain off). Specs under `tests/a11y/my-access-passport.spec.ts` exercise `/my-access` axe + keyboard smoke when those flags are on.
