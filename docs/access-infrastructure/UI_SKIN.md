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

## Place result panel

When flags allow, show:

- What works for you
- What may need adjustment
- What we don't know
- Known mismatches
- Evidence / last checked
- Alternatives & limitations
- Report a change
- Non-map browse link

Never rely on “Accessible ✅” alone.

## Accessibility baseline

WCAG 2.2 AA for My Access and place compatibility surfaces: keyboard, visible focus, names/roles/states, reflow, plain-language errors, reduced motion, accessible dialogs for report actions.
