# VoliSoma public beta foundation

Status: **working static browser simulation**, not a published clinical or robotic device.

This isolated, reviewable experiment implements a branded, responsive public research landing page and a **functional browser-side simulated robotic-assistance workflow**. It keeps all actions entirely in-browser. Accessible operation includes keyboard controls, separate proposal and confirmation, independent STOP/RESET, text status, event log and reduced-motion handling. No EEG acquisition or hardware command path exists.

## Run
Open `index.html` directly in a modern browser or serve this directory with any static web server. No dependencies or secret keys.

## Safeguards
- No neural signal collection, physical actuation, neuromodulation, or medical claims.
- No analytics or personal-data collection.
- Research links identify evidence but do not imply endorsement.
- Logo is custom inline SVG and uses accessible text.
- WCAG 2.2 AA is a target, not independently certified.
- This proof of concept has no registration endpoint; a future public beta will require an authenticated, validated, privacy-preserving backend.

## Core acceptance flows
1. Propose action -> confirmation enabled; no movement before confirmation.
2. Confirm -> simulated scene moves and activity log records the action.
3. STOP -> action cancelled; confirm disabled, visual returned to idle.
4. Change target/input/mode -> pending proposal invalidated.
5. Keyboard and screen reader access to controls, textual status changes and log.

## Integration and next gates
The separately created Base44 app is intended to provide real beta enrolment and project pages. Do not merge this experiment into MapAble Core or use the production MapAble Neon database until identity, tenant boundaries, data policies, accessibility, TGA/intended purpose and privacy reviews pass.

Conceptual foundation: Roger Clarke, `https://doi.org/10.1109/2.248881` (1994), Australian Disability Ltd rights-centred mission, Anthrogenisis hypothesis.
