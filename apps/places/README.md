# MapAble Places × CripSquare — UX-first Expo prototype

**Branch-only prototype. Not deployed, not linked to production accounts or CripSquare, and not WCAG/ATAG certified.**

This code implements an isolated Expo SDK 57 / React Native 0.86 mobile and web experience, informed by:
- the CripSquare / DisabilitySquare *village square* community concept and project briefs;
- MapAble's existing \`AccessPlace\` model and \`GET /api/access/places\` published-place endpoint;
- ATAG 2.0 Parts A/B and WCAG 2.2 AA, with native platform accessibility equivalents.

See [ATAG/WCAG acceptance matrix](./ACCESSIBILITY-QA.md).

## Working participant journeys

1. **Discover:** Browse Sydney example venues, search text, filter explicit step-free/toilet evidence, read published source warnings, save/unsave locally.
2. **My Places:** Write, edit and delete private journal notes about saved places without location check-ins or account identifiers.
3. **CripSquare:** Browse three **hypothetical** groups and activities; follow locally; record interest (NOT an RSVP); write, preview, edit and retain plain-text discussion drafts (NOT published).
4. **Contribute:** Choose a venue; record one accessibility feature, observed condition, source method and observation date; validate, preview, save, edit or delete a local draft. "Prepared for review" means **local status only**, not server submission.
5. **Privacy:** View connection state, export portable JSON by explicit OS sharing, reset/delete local records and read accessible authoring guidance.

### Functional boundary — important
- Local records persist across app restarts using AsyncStorage, **unencrypted**. Do not use identifiable medical details, exact movements or confidential information in prototype notes.
- No GPS permission, location events, background tracking, map SDK, check-in, location attestation, analytics SDK, booking, payment or AI is required. No contacts or photo permission.
- Optional live, read-only \`GET /api/access/places\` on an expressly configured MapAble base URL. It receives no location, disability preferences or personal records.
- The API returns a directory summary, **not detailed access evidence**; imported venue attributes remain **unknown** even when the directory confidence flag says verified. Do not infer step-free entry or toilet suitability from venue-category tags.
- The offline example dataset includes operator-source links reviewed 27 October 2026, but is not a MapAble audit or venue partnership.
- **CripSquare API integration is not implemented**: there was no verified executable CripSquare source or API contract in the selected project materials. Groups/events are test fixtures and posts stay on-device.

## Local setup (Node >=22.13 recommended)

\`\`\`bash
cd apps/places
npm install
npm run test
npm run typecheck
npm run web
\`\`\`

Visit the URL printed by Expo, typically \`http://localhost:8081\`.

For native prototypes, run \`npm run android\` or \`npm run ios\` with the appropriate simulator, or \`npm start\` and follow Expo's device instructions. Network access is required to install dependencies.

**Optional published MapAble places:**

\`\`\`bash
cp .env.example .env.local
# Set EXPO_PUBLIC_MAPABLE_API_URL=https://approved-mapable-host.example
npm run web
\`\`\`

Only configure an authorised HTTPS host or local loopback. Do not place keys/secrets in \`EXPO_PUBLIC_\` variables. Native phones cannot use \`localhost\` to reach a server running on another computer; use approved reachable development networking instead. Cross-origin web requests depend on MapAble server CORS; when blocked, the offline demonstration remains functional.

## UX and authoring constraints

- All core flows work without a map, GPS, voice, camera, drag-and-drop or AI.
- Labelled controls, radio-state indicators, text alternatives, large targets, readable contrast, visible errors and explicit previews.
- ATAG Part A: the authoring interface is intended to be operable by disabled authors.
- ATAG Part B: content prompts encourage descriptive titles, practical evidence, source dates and independent review; no image upload until alt-text/editor support is added.
- Intermittent connection: the demonstration dataset works offline after app launch, and venue import gracefully fails back to it. First install still requires packages.
- The app is intentionally small; no social-media feed, passive geolocation, leaderboards or personalised behavioural advertising.

## Verification

\`\`\`bash
npm run test
npm run typecheck
npm run build:web
\`\`\`

The tests exercise place data validation, on-device actions, restoration and evidence separation. Manual VoiceOver/TalkBack, desktop keyboard/screen-reader, 200%/400% reflow, accessible error recovery and participant co-design sessions remain essential.

The first feature release should not proceed until privacy/safeguarding governance, real content moderation, AD.iD integration and venue evidence review are approved. The demo is **not a replacement** for MapAble's existing canonical AccessPlace source of truth.
