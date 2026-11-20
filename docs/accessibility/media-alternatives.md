# Media alternatives (WS7)

## Marketing surfaces

`components/marketing/` and `app/(marketing)/` currently contain **no**
`<video>`, `<audio>`, or timed embeds. WCAG 1.2.6–1.2.9 effort is deferred
until media is introduced.

## Where media / images do exist

- **Floor-plan plan assets** — server authoring already requires `altText`
  (`lib/access/indoor/authoring/floor-plan-authoring-service.ts`). The admin
  studio form surfaces that prompt and blocks submit without it.
- **Ads creatives** — API now requires `altText` when `imageUrl` is set.
- **Future timed media** — follow the caption / transcript / audio-description
  pattern in
  `amalgamation/disability-simulations/apps/rohan-icu/src/components/AccessibleMediaPlayer.tsx`
  and complete the telehealth `VirtualCareHub` captions scaffold.
