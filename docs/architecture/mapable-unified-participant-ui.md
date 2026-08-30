# MapAble unified participant UI

Status:

- **Native Android participant UI:** merged to `main` via PR #547; implemented in repository code, not independently verified in production.
- **Web My MapAble participant UI:** implemented on `feat/mapable-unified-participant-web`; not independently verified in production.

This work aligns the authenticated web `My MapAble` home and native Android `Today` experience around one participant-control model. It does not activate new regulated services, change consent rules, or make Care, Transport or Jobs actions automatic.

## Design intent

The participant home should feel calm, capable and understandable at a glance:

- one clear greeting and daily summary;
- distinct Care, Transport and Jobs presentation rather than a blended marketplace;
- visible status text paired with colour, never colour alone;
- direct links to accessibility preferences and consent controls;
- a persistent human-support route;
- no automatic booking, dispatch, employment disclosure or cross-module information sharing;
- no assumption that an NDIS plan or live service is present merely because the UI can represent it.

## Web boundary

The web redesign is applied to `app/my/page.tsx`, which already sits behind the personal-agency gate and uses authorised user data.

The screen continues to use repository-backed state for:

- the signed-in participant name;
- today's authorised bookings;
- life intents when their feature flag is enabled.

It does **not** manufacture synthetic live service records. Empty states say when there is nothing scheduled and explicitly state that MapAble does not book a service automatically.

The participant-control panel links to existing:

- accessibility preferences;
- consent and information-sharing controls;
- human support and safety pathway;
- My MapAble controls.

The public marketing homepage remains separate. This design does not convert `mapable.com.au` public marketing pages into an authenticated dashboard or imply that controlled-pilot services are generally available.

## Android boundary

`apps/android` remains a thin native client over MapAble Core. The Android participant UI slice was merged separately through PR #547 before this web-only branch was created.

The native design system uses semantic service colours and reusable status, service-card and information-panel components. Meaning must also be present in visible labels and accessibility semantics.

Android preview data must remain clearly synthetic and development-only until protected participant data is connected through the existing MapAble authentication, RBAC, tenant and participant-context boundaries. Release builds must not fabricate participant schedules.

## Accessibility acceptance

This slice preserves the MapAble accessibility baseline:

- minimum Android interaction target: 48dp;
- minimum web interactive height: 48px for new primary controls;
- semantic heading structure;
- status expressed in text as well as colour;
- high-contrast navy/teal base with bounded service accents;
- visible keyboard focus rings on new web actions;
- no gesture-only critical interaction;
- human support is not hidden behind automation;
- content may wrap and reflow under large text rather than being forced into fixed-height cards;
- critical flows retain plain-language labels and recoverable alternatives.

Automated checks are necessary but do not replace TalkBack, keyboard, zoom/reflow, screen-reader and user testing.

## Participant-control invariants

1. Participant decisions are not inferred from recommendations.
2. Care, Transport and Jobs consent remain purpose-specific.
3. Disability, health or adjustment information is not silently disclosed to employers.
4. Location is not silently shared between services.
5. Service information is not silently combined across modules.
6. Human review remains available for consequential or safety-sensitive situations.
7. UI presentation is not evidence that a service, accreditation, NDIS registration or production integration is live.

## Validation target

Before merge consideration for the web slice:

- root TypeScript/typecheck checks pass for the changed route;
- formatting and lint do not show regressions introduced by this branch;
- accessibility review confirms keyboard focus, zoom/reflow, semantic headings and non-colour status meaning;
- existing authentication and personal-agency gates remain unchanged;
- any unrelated repository or deployment failures are reported separately.

The branch must not be treated as production deployment evidence. Merge, production deployment, feature-flag activation and regulated-service launch remain separate owner decisions.
