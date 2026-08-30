# MapAble unified participant UI

Status: **implemented in development branch; not independently verified in production**.

This slice aligns the existing web `My MapAble` home and native Android `Today` experience around one participant-control model. It does not activate new regulated services, change consent rules, or make Care, Transport or Jobs actions automatic.

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

The screen continues to use real repository-backed state for:

- the signed-in participant name;
- today's authorised bookings;
- life intents when their feature flag is enabled.

It does **not** manufacture synthetic live service records. Empty states say when there is nothing scheduled and explicitly state that MapAble does not book a service automatically.

The right-side participant controls link to existing:

- accessibility preferences;
- consent/sharing controls;
- human support/safety pathway;
- My MapAble controls.

## Android boundary

`apps/android` remains a thin native client over MapAble Core.

The Android design system now has semantic service colours for Care, Travel and Jobs plus reusable status, service-card and information-panel components. Meaning is also present in visible labels and accessibility semantics.

`TodayScreen` accepts typed `TodayItem` values. In debug builds `MainActivity` may provide clearly labelled synthetic preview items so the UI can be reviewed before native account access is enabled. Release builds do not fabricate participant schedule data.

## Accessibility acceptance

This slice is designed to preserve the existing accessibility baseline:

- minimum Android interaction target: 48dp;
- minimum web interactive height: 48px for the new primary controls;
- headings use semantic heading treatment;
- status is expressed in text as well as colour;
- high-contrast navy/teal base with bounded service accents;
- clear keyboard focus rings on new web actions;
- no gesture-only interaction;
- human support is not hidden behind automation;
- large text is allowed to wrap rather than being forced into fixed-height cards.

Automated checks are necessary but do not replace TalkBack, keyboard, zoom/reflow and user testing.

## Capability and claim control

The UI must not be read as evidence that a service is operational. Current implementation state must continue to be derived from repository and deployment evidence.

The following remain explicit product invariants:

1. participant decisions are not inferred from recommendations;
2. Care, Transport and Jobs consent remain purpose-specific;
3. disability or adjustment information is not silently disclosed to employers;
4. location is not silently shared between services;
5. human review remains available for consequential or safety-sensitive situations.

## Validation target for this branch

Before merge consideration:

- Android `:app:assembleDebug` passes;
- Android unit-test job remains green;
- root TypeScript/typecheck/build checks pass for files introduced by this branch;
- accessibility checks do not show regressions in the updated web route;
- any unrelated existing repository failures are reported separately.
