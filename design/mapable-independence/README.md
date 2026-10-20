# MapAble / Guided independence

An opt-in design-system proposal, not an app mockup.

**Start with [docs/AGENTS.md](docs/AGENTS.md)** for the integration contract, original-artwork rules, canonical-code observations, accessibility expectations and production limitations.

## Files

- `tokens.json` / `tokens.schema.json` — machine-readable source and editor schema.
- `tokens.css` / `checks.json` — generated scoped variables and measured checks.
- `styles.css` — semantic component classes, typography and preference treatments.
- `shadcn-bridge.css` — optional scoped HSL compatibility aliases.
- `MapAbleLogo.tsx` — unchanged square-image React component.
- `primitives.tsx` / `index.ts` — typed framework-neutral React building blocks.
- `assets/mapable-original.png` — original PNG bytes, copied without transformation.
- `reference.template.html` / `build.mjs` — maintainable self-contained visual reference.
- `tsconfig.check.json` — isolated no-emit TypeScript check.
- `verify-browser.mjs` — optional checks with existing Playwright/Chromium; no installs.

```sh
node design/mapable-independence/build.mjs --local
node design/mapable-independence/build.mjs --check
node_modules/.bin/tsc -p design/mapable-independence/tsconfig.check.json
node design/mapable-independence/build.mjs
node design/mapable-independence/verify-browser.mjs
```

The last command writes `generated-artifacts/mapable-brand/index.html` only if already ignored by Git. Open it directly in a browser. No installs, external assets, runtime server or deployment changes.
