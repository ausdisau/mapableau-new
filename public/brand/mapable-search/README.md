# MapAble Search campaign media

Status: **pending upload** (23 November 2026 Australia/Sydney).

See also [`docs/search/media-attribution.md`](../../../docs/search/media-attribution.md).

Sydney GoPro-style dolly visuals and the brand-reveal video were specified for
MapAble Search but were not present in the Cloud Agent workspace at
implementation time. Do not invent substitute media. Do not commit unrelated
music or lyric videos here.

## Expected package (when supplied)

From `MapAble_Sydney_GoPro_Dolly_GIFs.zip`:

- `MapAble_Sydney_harbour_bridge_POV_Dolly.gif` (+ matching preview PNG)
- `MapAble_Sydney_george_street_POV_Dolly.gif` (+ matching preview PNG)
- `MapAble_Sydney_opera_house_POV_Dolly.gif` (+ matching preview PNG)
- `MapAble_Sydney_barangaroo_POV_Dolly.gif` (+ matching preview PNG)
- `MapAble_Sydney_sydney_network_POV_Dolly.gif` (+ matching preview PNG)
- `MapAble_Sydney_GoPro_Dolly_Storyboard.mp4`
- Original illustrations, storyboard and source metadata

Separate campaign file:

- `MapAble_Logo_Brand_Reveal.mp4` — campaign artwork pending final brand approval.
  Default product chrome continues to use `/brand/mapable-logo*.{png,svg}`.

## Runtime exports to place in this folder

- `sydney-network-poster.webp` — static first-paint poster (network or harbour)
- `sydney-storyboard.mp4` — silent, user-triggered storyboard (`preload="none"`)

## Delivery rules

- Prefer Harbour Bridge or network **preview PNG/WebP** as the initial static hero.
- Storyboard MP4: user-triggered, silent, no autoplay.
- Do not load every GIF on first paint.
- Caption required: **Concept visualisation — routes illustrative; accessibility not verified.**
- Honour `prefers-reduced-motion`; media must never be required to use Search.

## Current runtime behaviour

`MapAbleSearchMedia` falls back to the official MapAble brand lockup and keeps
playback controls disabled until approved files are committed here.
