# MapAble Guided Independence — consumption contract

**Read this file for every subsequent MapAble artifact.** This directory is a proposed, opt-in design system, not a new app, not a replacement of the canonical app, and not a statement that the existing production UI has migrated.

The subsequent shared-logo integration is described in `NEXT-INTEGRATION.md`.
Statements below about canonical files being unchanged describe the initial
design-system authoring stage, before that integration.

## Identity: non-negotiable

- Use `assets/mapable-original.png`. It is a byte-identical copy of `attached_assets/MapAble_Accessibility_Logo_with_Gradient_Pin_1792453678172.png`.
- Preserve the entire 1254 × 1254 square, white background, gradient, wordmark, tagline and proportions. The image’s white is an intentional exception to the tinted UI surface palette.
- No cropping, tracing, recolouring, background removal, fabricated compact icon, CSS mask, alternate text lockup, added tagline pill or generated logo. No object-fit cover, clipping, blend modes or filters. Do not extract the pin.
- Use the provided `MapAbleLogo` or a plain image with 1254 × 1254 intrinsic dimensions and `object-fit: contain`. Do not override its styles to distort or crop it.
- At 240px square the artwork is suited to a roomy header/intro, not a 48px toolbar. Review its actual tagline legibility in context. Do not “solve” space constraints by making a new mark. The reference document’s plain-text title is a document label, not a replacement brand lockup.
- Deploy the original bytes to the host’s `public/brand/mapable-independence.png` only in an authorised integration change. This task does not write to `public/`. Pass another `src` if the host asset URL differs. CSS imports never deploy an image automatically. Vercel serves the public file at `/brand/mapable-independence.png` (include basePath/CDN prefix when needed). Do not route it through lossy image conversion. The guide embeds the exact PNG bytes in a data URL.

## Visual direction

Layout: **editorial field guide**. Mood: **welcoming civic humanism**. Blue leads, violet provides supporting context, gold/orange add warmth. Cream and blue-lilac surfaces soften the interface without removing contrast. Georgia display + Avenir Next/Trebuchet body + system monospace. All are local font stacks; exact glyphs vary by OS. Readable mode prefers locally available Atkinson Hyperlegible, falling back to Verdana. If exact cross-device typography is required, a later authorised host change must provide licensed self-hosted fonts. Do not add Google Font requests to self-contained artifacts.

Spacing uses a 4px base. Controls target 48px minimum. Large editorial headings belong to reference/intro surfaces; do not apply 5rem headings to dense task UIs. Motion is restrained 160ms transform feedback only; no perpetual skeleton animation.

## Import and opt in

For the canonical **Next.js App Router / Vercel** app, import once from its root layout in a later integration:

```tsx
import "@/design/mapable-independence/styles.css";
// Optional, only when using existing shadcn primitives:
import "@/design/mapable-independence/shadcn-bridge.css";
import { Button, TextField, MapAbleLogo } from "@/design/mapable-independence";

<section className="mapable-system" data-ma-theme="light">
  <MapAbleLogo priority />
  <TextField label="Preferred name" name="preferredName" />
  <Button onClick={openReview}>Review choices</Button>
</section>
```

`styles.css` imports generated `tokens.css`. Keep them together. Do not import the reference HTML as a stylesheet. This is CSS, not Tailwind configuration. Do not feed full hex values into a Tailwind `hsl()` recipe: generated custom properties contain space-separated HSL channels. All selectors are scoped to `.mapable-system`, with no `:root`, body reset or global `.dark` takeover.

React 18+ and React types are the only primitive dependencies. No Next, Wouter, Radix, Tailwind or icon package imports. Native `img` is intentional; projects with `@next/next/no-img-element` must document a narrow lint exemption or adopt `next/image` with `unoptimized`, square dimensions and unchanged asset after approval. Primitives have a `"use client"` boundary because they use `useId`/refs and accept interaction handlers; the logo is server-compatible. Event callbacks must be defined in a host Client Component. Do not pass function props from Server Components.

`Button` defaults to `type="button"`; use `type="submit"` explicitly. `busy` disables duplicate clicks but callers must supply honest busy text and an appropriate status announcement. `ActionLink` renders a real anchor: no `asChild` API. Use Next `Link` with the `ma-button` class and `data-variant` directly instead of nesting anchors. Do not invent disabled links; unavailable navigation should be non-interactive explanatory content. React primitives use host-controlled input values/onChange or native uncontrolled fields; they do not persist anything.

## Themes and preferences

Put preferences on the **same** `.mapable-system` root:

- `data-ma-theme="light"` — default, restful daylight.
- `data-ma-theme="dark"` — deliberate dark surface.
- `data-ma-theme="contrast"` — high-contrast light variant.
- `data-ma-theme="system"` — device dark preference, with device increased-contrast preference taking priority.
- `data-ma-font="readable"` — readable body and headings.
- `data-ma-motion="reduce"` — opt-in reduced motion in addition to automatic OS preference.

Explicit theme selection wins over device settings. Existing canonical `.dark` does not switch the new system: mirror its resolved value into `data-ma-theme` in the host theme provider. Existing `html[data-a11y-font="readable"]` and `dyslexia-friendly` are respected; do not copy the canonical self-referential `--font-readable` declaration. Browser forced colours remain enabled; never globally disable forced-colour adjustment.

The reference controls are native selects/checkboxes, keyboard accessible, local-only and deliberately not persisted. No storage, network, tracking or real participant data.

## Existing shadcn and canonical code

Inspected with `git show origin/main:<path>` at canonical main commit `5a41cddfc95bc4cbe1daab20fbf1f82411a6e061`: `components/brand/MapAbleLogo.tsx`, `components/brand/MapAbleBrandLockup.tsx`, `app/index.css`, `docs/design-system.md`, `lib/brand/styles.ts`, `components/ui/button.tsx`. These files were **not edited**.

Important differences:

1. Canonical tokens are teal/green; these are artwork-derived blue/violet/orange/gold. Do not silently change global semantics. Map styling, module metadata and map marker logic remain unchanged.
2. Canonical logo supports `mark`/`text`, uses separate assets, and the lockup reconstructs a tagline pill. Those treatments do **not** satisfy the requested exact-image identity. Integrate this component deliberately; it is not a signature-compatible drop-in replacement.
3. Canonical brand recipes include hardcoded slate/teal/white, and the button is re-exported from `@mapable/ui`. Scoped tokens cannot recolour hardcoded utility classes or prove that package’s computed styles. Audit and adapt recipes separately, preserving existing routing, event handlers and accessibility.
4. For token-based existing shadcn components, use `data-ma-shadcn="true"` on the theme root and import the optional bridge **after** system CSS. It provides HSL aliases expected by existing Tailwind mappings, without redefining global tokens. Existing component hover, disabled, focus and variant recipes still need visual testing; aliases do not guarantee parity.
5. Radix/shadcn portals often render outside the wrapper. Set their portal container inside the themed root or wrap the portal content in the same `.mapable-system` with matching theme/preferences/bridge attributes. Do not assume inherited variables cross DOM boundaries.
6. Reuse canonical `CoreHubCard`, shells and skip links for the app. This reference is not permission to replace the app with an Express/Vite preview or to invent new navigation.

## Accessibility and honest states

- Use semantic headings, native controls, one clear primary action, visible labels and plain-language errors. `TextField` associates labels, hints and errors using `useId`; the host owns validation timing and focus to the first invalid field.
- Add error summary/focus management for multi-field forms and focus restoration for dialogs. No modal primitive is included: use the host’s tested accessible dialog.
- `Notice` is not automatically an alert; set a live role only for actual dynamic changes. `ErrorState` is an alert; mount on a real failure, not repeatedly on every render.
- `LoadingState` announces its actual label through `role=status`. The host must replace it on completion, set `aria-busy` on the relevant region as appropriate, and handle timeout/retry. Skeletons are decorative.
- Keep disabled reasons visible. Never reduce a whole control’s opacity as the only disabled treatment.
- Check keyboard traversal, focus occlusion, 200% text, 400% zoom, 320 CSS px reflow, touch, screen reader labels and announcements in each **consuming page**. Token contrast checks are not a WCAG certification. Transparent overlays, images, inherited utilities and arbitrary child content can break contrast.
- Gold and orange are decorative tokens, not generally approved body-text colours. `rule` is a subtle separator, not an interactive boundary; use `border` for inputs.

## Consent, authority and human coordination

Every subsequent artifact must distinguish:

- **Consent:** an explicit, specific choice with recipient, information, purpose, expiry, refusal and withdrawal explained. Never pre-tick it or infer it from a support relationship.
- **Authority:** independently verified role, scope, subject and expiry. UI labels cannot grant authority; verify server-side before actions.
- **Coordination:** a named human pathway with honest availability and escalation. No chatbot message, “reviewed” badge or fictional coordinator may imply verified real-world safety.

The consent form in the reference is labelled illustrative, local-only and non-persistent. Production needs backend consent records, policy decisions, identity/authority checks, revocation, retention and append-only audit handling as required by the host. These are **not implemented here**. Do not send health or identity data to a design specimen. Accessible-place facts need source, review date and uncertainty. Avoid blanket “fully accessible” claims.

## Build and checks

No package installs or workflows are needed:

```sh
# Generate scoped tokens.css, checks.json and local self-contained reference.html:
node design/mapable-independence/build.mjs --local
# Verify logo byte identity, generated CSS parity, declared contrast pairs and HTML IDs/anchors:
node design/mapable-independence/build.mjs --check
# Type-check only these primitives using existing workspace TypeScript/React types:
node_modules/.bin/tsc -p design/mapable-independence/tsconfig.check.json
# Generate the requested final guide; refuses unless the output is already Git-ignored:
node design/mapable-independence/build.mjs
# Optional, with existing workspace Playwright and Chromium (no browser download):
node design/mapable-independence/verify-browser.mjs
```

Final output: `generated-artifacts/mapable-brand/index.html`. Do not edit generated files manually. Edit `tokens.json`, `styles.css`, `reference.template.html`, then rebuild. `tokens.schema.json` describes this repository-specific format; it is not a W3C DTCG claim. The dependency-free build validates theme key parity, colour syntax and contrast; the schema is available for editor validation, not executed by a newly installed validator. `checks.json` records source hash and measured pair ratios.

The optional browser check uses the existing workspace `@playwright/test` and `/repl/tools/bin/chromium` when present; elsewhere set `MAPABLE_CHROMIUM` to an existing Chromium executable. It checks 1440/768/390/320px reflow, image loading, computed theme/font/motion, system dark preference, keyboard control order, consent/refusal/reset, recovery and absence of script errors/external requests. It does not install browsers, take screenshots or certify screen-reader behaviour.

Do not modify root app files, package metadata, Git config, deployment or backend as part of generating a reference. Main agent must set output ignores before final generation. A browser can open the single HTML file directly; its inline CSS, native script and data-URL image need no server. If embedding within a restrictive CSP, the host must provide approved hashes/nonces and allow `img-src data:` or serve the original logo separately; do not weaken production CSP globally.
