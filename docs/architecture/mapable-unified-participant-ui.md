# MapAble unified participant UI

Status:

- **Native Android participant UI:** base participant slice merged to `main` via PR #547; adaptive Today refinements and Compose accessibility test coverage are in draft PR #548. Implemented in repository code, not independently verified in production.
- **Web My MapAble participant UI:** implemented in draft PR #548 on `feat/mapable-unified-participant-web`; not independently verified in production.

This work aligns the authenticated web `My MapAble` home and native Android `Today` experience around one participant-control design contract. It does not activate new regulated services, change consent rules, or make Care, Transport or Jobs actions automatic.

## Shared design contract

The web and native clients intentionally share semantics rather than a cross-platform UI runtime. Web primitives live in `components/mapable-ui/ParticipantUi.tsx`; Android equivalents remain in `apps/android/core/designsystem` and `apps/android/core/ui`.

The contract is:

- MapAble navy/teal foundation with bounded Care, Travel, Jobs and support accents;
- minimum 48px web and 48dp Android primary interaction targets;
- visible status text and accessible names paired with colour, never colour alone;
- rounded, reflowable information panels rather than fixed-height cards;
- consistent participant actions for reviewing sharing, accessing human support and entering distinct service areas;
- visible focus or native semantics for interactive controls;
- no UI element may imply consent, authorisation, verification or service availability merely through its visual state.

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

Reusable participant UI primitives are defined in `components/mapable-ui/ParticipantUi.tsx` for panels, markers, status labels, action links and service shortcuts. The participant-control panel links to existing:

- accessibility preferences;
- consent and information-sharing controls;
- human support and safety pathway;
- My MapAble controls.

The public marketing homepage remains separate. This design does not convert `mapable.com.au` public marketing pages into an authenticated dashboard or imply that controlled-pilot services are generally available.

## Android boundary

`apps/android` remains a thin native client over MapAble Core. The base Android participant UI slice was merged through PR #547. Draft PR #548 adds an adaptive Today layout without changing API, auth, RBAC, tenant, participant-context or production configuration.

The native design system uses semantic service colours and reusable status, service-card and information-panel components. Meaning must also be present in visible labels and accessibility semantics.

`TodayScreen` uses a compact single-column flow by default and switches at `840dp` to a wider two-column presentation: the daily timeline receives the larger region while My Access and human-support controls remain visible alongside it. Content remains reflowable and does not depend on fixed card heights.

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

## Automated validation introduced in this slice

Web coverage is in `tests/a11y/unified-participant-ui.spec.ts` and is included in the Playwright participant project. It checks:

- the Today, My Access and Need help headings;
- explicit Review sharing and Get human support actions;
- serious/critical axe findings through the existing `@axe-core/playwright` helper;
- keyboard focus visibility;
- equivalent 200% and 400% reflow widths at 640px and 320px without excessive horizontal overflow;
- reduced-motion rendering of critical controls.

Android coverage is in `apps/android/feature/today/src/androidTest/java/au/com/mapable/feature/today/TodayScreenTest.kt`. It checks participant-control labels and textual status semantics. The Android workflow compiles this instrumentation test with `:feature:today:compileDebugAndroidTestKotlin` in addition to existing unit-test and debug-assembly steps.

Compilation is not the same as device execution. Emulator/device instrumentation, TalkBack, large-font/display scaling, landscape, tablet/foldable, keyboard/switch-style navigation and user testing remain required before accessibility can be claimed beyond the implemented automated evidence.

## Participant-control invariants

1. Participant decisions are not inferred from recommendations.
2. Care, Transport and Jobs consent remain purpose-specific.
3. Disability, health or adjustment information is not silently disclosed to employers.
4. Location is not silently shared between services.
5. Service information is not silently combined across modules.
6. Human review remains available for consequential or safety-sensitive situations.
7. UI presentation is not evidence that a service, accreditation, NDIS registration or production integration is live.

## Validation target

Before merge consideration for this draft slice:

- root TypeScript/typecheck checks pass for changed web code or any failures are proven pre-existing;
- formatting and lint show no regression introduced by this branch;
- the Playwright participant project runs the unified participant UI test with its seeded participant state;
- Android CI compiles the Today instrumentation test and assembles the debug application;
- responsive checks cover 640px and 320px web reflow and the Android `840dp` adaptive layout boundary;
- existing authentication and personal-agency gates remain unchanged;
- any unrelated repository or deployment failures are reported separately;
- manual assistive-technology testing remains a release gate rather than being inferred from automation.

The branch must not be treated as production deployment evidence. Merge, production deployment, feature-flag activation and regulated-service launch remain separate owner decisions.
