# AAA token & brand exceptions

## Wordmark asset (`public/brand/mapable-logo-wordmark.png`)

The portrait PNG lockup (754×940) is **not** used in marketing headers anymore.
`MapAbleBrandLockup` renders the SVG mark (`mapable-logo-mark.svg`) plus an HTML
“MapAble” wordmark and the Empowering Independence pill. That removes the
images-of-text (1.4.9) squeeze issue and the yellow-on-white focus outline
failure (1.62:1).

The PNG remains available for JSON-LD / crawlers that still prefer a raster logo
URL until a brand-supplied horizontal wordmark asset is delivered.

## Yellow (`#F8C51C`)

Restricted to navy/dark surfaces and dual focus `ring-offset`. Never use as text
or focus outline alone on white.

## Green (`#00A979`)

Decorative / non-text only. Body and status copy must use `brandGreenText`
(`#005A42`, ≥7:1 on white).
