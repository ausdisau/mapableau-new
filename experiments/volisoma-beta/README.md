# VoliSoma Public Research Beta

**Current status:** verified standalone simulated web interface. **Not yet publicly hosted.** This is not a medical device, brain-signal decoder, neuromodulation controller or actual robot.

## Source of truth
- GitHub PR #624 (draft): `ausdisau/mapableau-new`, branch `feat/volisoma-beta-foundation-20261028`
- Site root: `experiments/volisoma-beta/`
- Main artifact: `index.html`, standalone HTML with embedded styles, icon and JavaScript; no npm build or backend required.
- Australian Disability Ltd endorsed VoliSoma wordmark is a proposed concept, not a copy of the official corporate logo.

## Functional scope
- Virtual AAC / gaze / switch / synthetic EEG input choices (selection **does not** read or process any actual signal)
- Virtual phone / book / remote selection
- Direct, shared-autonomy and supervised task labels (illustrative simulation)
- Proposed action stays pending until explicit confirmation
- STOP ALL latches the simulator and requires Reset
- Changing a control preference invalidates an unconfirmed proposal
- Session-only event history and explicitly requested local JSON download
- Research references, safety limitations and Australian Disability Ltd attribution
- Static, accessible information without sign-in, analytics or networked personal-data submission

## How to preview
Open `index.html` in a modern desktop or mobile browser. This file has no external code dependencies. The interface was smoke tested at desktop (1440px) and mobile (390px) widths, with the full approval -> stop -> reset -> local download sequence and zero observed horizontal overflow. Eight standalone state-transition tests also passed during the source build; the test harness is provided in the downloadable implementation package, not currently committed to this branch.

## Independent deployment: manual provider setup required
On Vercel, the project create attempt in team `MapAble` failed with HTTP 402 `resource_creation_blocked` indicating a suspended subscription. **Do not attempt to bypass billing or deploy via the current blocked account.**

Use a static host under a separately controlled account (e.g. Cloudflare Pages or Render Static Sites), with:
- GitHub repository `ausdisau/mapableau-new`
- Deployment branch `feat/volisoma-beta-foundation-20261028` for a **bounded beta preview only**
- Root directory `experiments/volisoma-beta`
- Framework: `none`; build command: none; output directory: repository subfolder itself
- Serve `index.html` at the root
- No secrets, no database, no personal data, no analytic scripts
- Enforce HTTPS and security headers via hosting configuration

Important: a production site should ideally be split to `ausdisau/volisoma` or assigned its own release branch and dedicated host. Never auto-deploy the MapAble main branch to this public prototype.

## Launch gate
- [x] Standalone interactive HTML and embedded dependencies
- [x] Static browser responsive smoke test
- [x] Unit state-transition checks (8/8 local at implementation time)
- [ ] Independent keyboard, NVDA, VoiceOver, TalkBack and alternative-input audit
- [ ] Correct publication of approved Australian Disability Ltd logo and brand assets
- [ ] Security/third-party link/claim and evidence editorial review
- [ ] Host account connected, domain approved and public URL HTTP checks passed
- [ ] Human approval of release

## Next: Expo, deferred
Do not ship native code in the static beta. When a separate Expo app is started, reuse the control-state contract and access-first labels. Run native TalkBack/VoiceOver testing and measure performance before any optimisation. Neural/robotic hardware interfaces and clinical claims remain excluded pending appropriate independent safety, privacy, consent, and regulatory review.
